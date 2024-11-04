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
    const query = "SELECT user_id, student_uid, full_name, student_school, student_phone FROM students WHERE user_id = ?";

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
    const userId1 = req.session.user.id;
    const query1 = "SELECT user_id, ins_uid, full_name, ins_school, ins_phone FROM instructors WHERE user_id = ?";

    db.query(query1, [userId1], (err, results) => {
        if (err) {
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