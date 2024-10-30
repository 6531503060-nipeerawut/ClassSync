// In your routes file (e.g., routes/schedule.js or app.js)
const express = require('express');
const router = express.Router();
const db = require("../routes/db-config");

router.get('/schedule', (req, res) => {
    // Example data you want to pass to the EJS template
    const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const userId = req.session.user.id;    
    const query = "SELECT user_id, full_name, student_school FROM students WHERE user_id = ?";

    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).render("student/schedule", { user: null, days: null, timeSlots: null });
        }

        if (results.length === 0) {
            return res.status(404).render("student/schedule", { user: null, days: null, timeSlots: null });
        }

        const user = results[0];
        res.status(200).render("student/schedule", { user, days, timeSlots });
    });
});

module.exports = router;