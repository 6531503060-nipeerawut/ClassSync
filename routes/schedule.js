// In your routes file (e.g., routes/schedule.js or app.js)
const express = require('express');
const router = express.Router();

router.get('/schedule', (req, res) => {
    // Example data you want to pass to the EJS template
    const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const name = ""; //    
    const className = ""; //

    // Render the EJS file and pass the required variables
    res.render('schedule', {
        name: name,
        className: className,
        timeSlots: timeSlots,
        days: days
    });
});

module.exports = router;