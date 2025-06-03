const express = require("express");
const router = express.Router();
const db = require("./db-config");

const checkAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        return res.status(401).render('login', { errState: true, message: "Please login first" });
    }
};

router.get('/dashboard', checkAuth, async (req, res) => {
    console.log("📊 Dashboard request from user:", req.session.user);
    
    const studentId = req.session.user.id;
    console.log("👨‍🎓 Student ID:", studentId);

    const query = `
        SELECT
            s.user_id,
            s.full_name,
            c.course_code,
            c.course_name,
            cls.class_section,
            cls.class_room,
            p.check_id,
            DATE_FORMAT(p.par_date, '%d/%m/%Y') AS par_date,
            p.par_time,
            ch.check_status
        FROM
            participants p
        JOIN
            enrollments e ON p.enrollment_id = e.enroll_id
        JOIN
            students s ON e.enroll_student = s.user_id
        JOIN
            checks ch ON p.check_id = ch.check_id
        JOIN
            classes cls ON e.enroll_class = cls.class_id
        JOIN
            courses c ON cls.class_course = c.course_id
        WHERE
            s.user_id = ? AND
            ch.check_status IN ('check-in', 'check-out')
        ORDER BY
            c.course_code, p.par_date DESC, p.par_time DESC
    `;

    try {
        console.log("🔍 Executing query for student ID:", studentId);
        
        const [results] = await db.query(query, [studentId]);
        
        console.log("📊 Query results count:", results.length);
        
        if (results.length > 0) {
            console.log("✅ Sample result:", results[0]);
        } else {
            console.log("⚠️  No attendance records found for student:", studentId);
        }
        
        res.render('student/dashboard', {
            attendanceSummary: results,
            user: req.session.user
        });
        
    } catch (err) {
        console.error("❌ Error retrieving attendance summary:", err);
        
        res.render('student/dashboard', {
            attendanceSummary: [],
            user: req.session.user,
            error: "ไม่สามารถดึงข้อมูลการเข้าเรียนได้ในขณะนี้"
        });
    }
});

router.get('/debug-data', checkAuth, async (req, res) => {
    const studentId = req.session.user.id;
    
    try {
        const [students] = await db.query("SELECT * FROM students WHERE user_id = ?", [studentId]);
        const [enrollments] = await db.query("SELECT * FROM enrollments WHERE enroll_student = ?", [studentId]);
        const [participants] = await db.query(`
            SELECT p.* FROM participants p
            JOIN enrollments e ON p.enrollment_id = e.enroll_id
            WHERE e.enroll_student = ?
        `, [studentId]);
        
        res.json({
            studentId: studentId,
            students: students,
            enrollments: enrollments,
            participants: participants
        });
        
    } catch (err) {
        console.error("Debug query error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;