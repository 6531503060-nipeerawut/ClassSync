const express = require("express");
const router = express.Router();
const db = require("../routes/db-config");

const checkAuth = (req, res, next) => {
    if (req.session.user) {
        res.locals.session = req.session;
        next();
    } else {
        return res.status(401).render("login", { errState: true, message: "Please login first" });
    }
};

const checkAlreadyEnroll = async (req, res, next) => {
    try {
        const { courseCode } = req.body;
        const userID = req.session.user.id;

        const [results] = await db.query(`
            SELECT enrollments.*, courses.course_code
            FROM enrollments
            JOIN classes ON enrollments.enroll_class = classes.class_id
            JOIN courses ON classes.class_course = courses.course_id
            WHERE enrollments.enroll_student = ?
        `, [userID]);

        const isEnrolled = results.some(enroll => enroll.course_code === courseCode);

        if (isEnrolled) {
            return res.status(400).json({ message: "Student is already enrolled in this course and section." });
        }

        next();
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

router.get("/", checkAuth, (req, res) => {
    res.render("student/index", { name: null });
});

router.get("/join", checkAuth, (req, res) => {
    res.render("student/join");
});

router.get("/checkinout", checkAuth, (req, res) => {
    res.render("student/checkinout");
});

router.get("/class/data/join", checkAuth, async (req, res) => {
    try {
        const userID = req.session.user.id;
        const [result] = await db.query(`
            SELECT enrollments.*, courses.*, classes.*
            FROM enrollments
            JOIN classes ON enrollments.enroll_class = classes.class_id
            JOIN courses ON classes.class_course = courses.course_id
            WHERE enrollments.enroll_student = ?
        `, [userID]);

        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/course/:course_id/details", checkAuth, async (req, res) => {
    try {
        const { course_id } = req.params;
        const [result] = await db.query(`
            SELECT enrollments.*, courses.*, classes.*
            FROM enrollments
            JOIN classes ON enrollments.enroll_class = classes.class_id
            JOIN courses ON classes.class_course = courses.course_id
            WHERE enrollments.enroll_student = ? AND enrollments.enroll_class = ?
        `, [req.session.user.id, course_id]);

        res.render("student/courseDetails", { data: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/check/join", checkAuth, checkAlreadyEnroll, async (req, res) => {
    const { courseCode, courseSection, coursePassword } = req.body;

    try {
        const [result] = await db.query(`
            SELECT classes.class_id, courses.course_code, classes.class_section, classes.class_password
            FROM courses
            RIGHT JOIN classes ON courses.course_id = classes.class_course
            WHERE courses.course_code = ? AND classes.class_section = ? AND classes.class_password = ?
        `, [courseCode, courseSection, coursePassword]);

        if (result.length > 0) {
            return res.status(200).json({ message: "Course found (status: Ready to join)" });
        } else {
            return res.status(404).json({ message: "Course OR Section Not found" });
        }
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});

router.post("/unenroll", checkAuth, async (req, res) => {
    const { enroll_id } = req.body;

    try {
        const [result] = await db.query("DELETE FROM enrollments WHERE enroll_id = ?", [enroll_id]);
        if (result.affectedRows === 1) {
            return res.status(200).json({ message: "Deleted successfully" });
        }
        return res.status(400).json({ message: "Unable to delete" });
    } catch (err) {
        return res.status(500).json({ message: "Can't delete this Course" });
    }
});

router.post("/join", checkAuth, checkAlreadyEnroll, async (req, res) => {
    const { courseCode, courseSection, coursePassword } = req.body;
    const userid = req.session.user.id;

    try {
        const [result] = await db.query(`
            SELECT classes.class_id
            FROM courses
            RIGHT JOIN classes ON courses.course_id = classes.class_course
            WHERE courses.course_code = ? AND classes.class_section = ? AND classes.class_password = ?
        `, [courseCode, courseSection, coursePassword]);

        if (result.length > 0) {
            await db.query(
                "INSERT INTO enrollments(enroll_class, enroll_student) VALUES(?, ?)",
                [result[0].class_id, userid]
            );
            return res.status(200).json({ message: "You joined successfully, Please wait 3 seconds to reload courses" });
        } else {
            return res.status(404).json({ message: "Course not found" });
        }
    } catch (err) {
        return res.status(500).json({ message: "Cannot join course" });
    }
});

router.post("/checkinout", checkAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { checks } = req.body;

    const date = new Date().toISOString().split("T")[0];
    const time = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Bangkok",
        hour12: false,
    });

    const checkType = checks == 1 ? 1 : checks == 2 ? 2 : null;
    const actionName = checkType === 1 ? "Check-in" : "Check-out";

    if (!checkType) {
        return res.status(400).render("student/checkinout", {
            errState: true,
            message: "Invalid check type",
            user: null,
        });
    }

    try {
        const [[student]] = await db.query("SELECT user_id, student_uid, full_name FROM students WHERE user_id = ?", [userId]);
        if (!student) {
            return res.status(404).render("student/checkinout", {
                errState: true,
                message: "Student not found",
                user: null,
            });
        }

        const [[enrollment]] = await db.query("SELECT enroll_id FROM enrollments WHERE enroll_student = ? ORDER BY enroll_id DESC LIMIT 1", [student.user_id]);
        if (!enrollment) {
            return res.status(404).render("student/checkinout", {
                errState: true,
                message: "Enrollment not found",
                user: null,
            });
        }

        await db.query("INSERT INTO participants(check_id, student_id, enrollment_id, par_date, par_time) VALUES(?,?,?,?,?)", [
            checkType, student.user_id, enrollment.enroll_id, date, time,
        ]);

        return res.status(200).render("student/checkinout", {
            errState: false,
            message: `${actionName} successful`,
            user: student,
        });
    } catch (err) {
        console.error(`Error during ${actionName}:`, err);
        return res.status(500).render("student/checkinout", {
            errState: true,
            message: `${actionName} failed`,
            user: null,
        });
    }
});

module.exports = router;