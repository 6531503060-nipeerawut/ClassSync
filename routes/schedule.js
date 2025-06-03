const express = require('express');
const router = express.Router();
const db = require('../routes/db-config');

router.get('/schedule', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const userId = req.session.user.id;

    try {
        const [results] = await db.query(
            "SELECT user_id, full_name, student_school FROM students WHERE user_id = ?",
            [userId]
        );

        if (!results || results.length === 0) {
            return res.status(404).render("student/schedule", {
                user: null,
                days,
                timeSlots,
                error: "ไม่พบข้อมูลผู้ใช้"
            });
        }

        const user = results[0];
        res.render("student/schedule", {
            user,
            days,
            timeSlots,
            error: null
        });

    } catch (err) {
        console.error("❌ DB error:", err);
        res.status(500).render("student/schedule", {
            user: null,
            days,
            timeSlots,
            error: "เกิดข้อผิดพลาดในการดึงข้อมูล"
        });
    }
});

module.exports = router;