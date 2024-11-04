const express = require("express");
const router = express.Router();
const db = require("./db-config");

const checkAuth = (req, res, next) => {
    if (req.session.user) {
        res.locals.session = req.session;
        return next();
    } else {
        return res.status(401).render('login', { errState: true, message: "Please login first" });
    }
};

router.get("/profileS", checkAuth, (req, res) => {
    const userId = req.session.user.id;
    const query = `
        SELECT students.user_id, students.student_uid, students.full_name, students.student_school, students.student_phone, users.email
        FROM students
        JOIN users ON students.user_id = users.user_id
        WHERE students.user_id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching user profile:", err);
            return res.status(500).render("student/profile", { user: null });
        }

        if (results.length === 0) {
            return res.status(404).render("student/profile", { user: null });
        }

        const user = results[0];
        res.status(200).render("student/profile", { user });
    });
});

router.get("/profileI", checkAuth, (req, res) => {
    const userId = req.session.user.id;
    const query = `
        SELECT instructors.user_id, instructors.ins_uid, instructors.full_name, instructors.ins_school, instructors.ins_phone, users.email
        FROM instructors
        JOIN users ON instructors.user_id = users.user_id
        WHERE instructors.user_id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching instructor profile:", err);
            return res.status(500).render("instructor/profile", { user: null });
        }

        if (results.length === 0) {
            return res.status(404).render("instructor/profile", { user: null });
        }

        const user = results[0];
        res.status(200).render("instructor/profile", { user });
    });
});


module.exports = router;