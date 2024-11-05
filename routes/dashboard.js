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

router.get('/dashboard', checkAuth, (req, res) => {
    const studentId = req.session.user.id;

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
  students s ON e.enroll_student = s.user_id  -- Changed from p.student_id to e.enroll_student for proper linking
JOIN 
  checks ch ON p.check_id = ch.check_id
JOIN 
  classes cls ON e.enroll_class = cls.class_id
JOIN 
  courses c ON cls.class_course = c.course_id
WHERE 
  ch.check_status IN ('check-in', 'check-out')  -- Keeps only check-in and check-out entries
ORDER BY 
  s.user_id, c.course_code, p.par_date, p.par_time;

    `;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error("Error retrieving attendance summary:", err);
            return res.status(500).send("Error retrieving attendance summary");
        }
        res.render('student/dashboard', { attendanceSummary: results, user: req.session.user });
    });
});

module.exports = router;