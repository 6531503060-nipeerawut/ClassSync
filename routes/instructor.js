const express = require("express");
const router = express.Router();
const db = require("../routes/db-config");

const checkAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        return res.status(401).render('login', { errState: true, message: "Please login first" });
    }
};

router.get("/", checkAuth, (req, res) => {
    const userid = req.session.user.id;
    res.render("instructor/index", { id: userid, errState: null, message: null });
});

router.get("/course", checkAuth, async (req, res) => {
    const userid = req.session.user.id;
    try {
        const [courses] = await db.query("SELECT * FROM courses WHERE ins_id = ?", [userid]);
        const [classes] = await db.query("SELECT * FROM classes WHERE class_ins = ?", [userid]);

        res.status(200).render("instructor/index", {
            id: userid,
            errState: false,
            message: "Refresh Success",
            courses,
            classes,
        });
    } catch (err) {
        console.error("❌ Error fetching courses or classes:", err);
        res.status(500).render("instructor/index", {
            id: userid,
            errState: true,
            message: "Cannot refresh from server (500)",
            courses: [],
            classes: [],
        });
    }
});

router.get("/del/:id", checkAuth, async (req, res) => {
    const userid = req.session.user.id;
    const delID = req.params.id;
    try {
        await db.query("DELETE FROM classes WHERE class_course = ? AND class_ins = ?", [delID, userid]);
        await db.query("DELETE FROM courses WHERE course_id = ? AND ins_id = ?", [delID, userid]);

        const [courses] = await db.query("SELECT * FROM courses WHERE ins_id = ?", [userid]);
        const [classes] = await db.query("SELECT * FROM classes WHERE class_ins = ?", [userid]);

        res.status(200).render("instructor/index", {
            id: userid,
            errState: false,
            message: "Delete Success",
            courses,
            classes,
        });
    } catch (err) {
        console.error("❌ Error during delete:", err);
        res.status(500).render("instructor/index", {
            id: userid,
            errState: true,
            message: "Cannot delete the course (500)",
            courses: [],
            classes: [],
        });
    }
});

router.post("/course", checkAuth, async (req, res) => {
    const { courseCode, courseName, courseCredit } = req.body;
    const userid = req.session.user.id;

    try {
        const [result] = await db.query(
            "INSERT INTO courses (course_code, course_name, course_credit, ins_id) VALUES (?, ?, ?, ?)",
            [courseCode, courseName, courseCredit, userid]
        );

        if (result.affectedRows > 0) {
            const [courses] = await db.query("SELECT * FROM courses WHERE ins_id = ?", [userid]);
            const [classes] = await db.query("SELECT * FROM classes WHERE class_ins = ?", [userid]);

            return res.status(200).render("instructor/index", {
                id: userid,
                errState: false,
                message: "Course inserted successfully",
                courses,
                classes,
            });
        } else {
            return res.status(500).render("instructor/index", {
                id: userid,
                errState: true,
                message: "Failed to add course",
                courses: [],
                classes: [],
            });
        }
    } catch (err) {
        console.error("❌ Error adding course:", err);
        res.status(500).render("instructor/index", {
            id: userid,
            errState: true,
            message: "Server Error (500)",
            courses: [],
            classes: [],
        });
    }
});

router.post("/edit/:id", checkAuth, async (req, res) => {
    const userid = req.session.user.id;
    const courseID = req.params.id;
    const { course_code, course_name, course_credit } = req.body;

    try {
        await db.query(
            "UPDATE courses SET course_code = ?, course_name = ?, course_credit = ? WHERE course_id = ? AND ins_id = ?",
            [course_code, course_name, course_credit, courseID, userid]
        );

        const [courses] = await db.query("SELECT * FROM courses WHERE ins_id = ?", [userid]);
        const [classes] = await db.query("SELECT * FROM classes WHERE class_ins = ?", [userid]);

        res.status(200).render("instructor/index", {
            id: userid,
            errState: false,
            message: "Course updated successfully",
            courses,
            classes,
        });
    } catch (err) {
        console.error("❌ Error updating course:", err);
        res.status(500).render("instructor/index", {
            id: userid,
            errState: true,
            message: "Cannot update the course (500)",
            courses: [],
            classes: [],
        });
    }
});

router.post("/section", checkAuth, async (req, res) => {
    const { course_id, section, classroom, class_ins, password } = req.body;
    const userid = req.session.user.id;

    try {
        const [result1] = await db.query("SELECT * FROM courses WHERE ins_id = ?", [userid]);
        const [result2] = await db.query("SELECT * FROM classes WHERE class_ins = ?", [userid]);

        await db.query(
            "INSERT INTO classes (class_course, class_section, class_room, class_ins, class_password) VALUES (?, ?, ?, ?, ?)",
            [course_id, section, classroom, class_ins, password]
        );

        return res.status(200).render("instructor/index", {
            id: userid,
            errState: false,
            message: "Section added successfully",
            courses: result1,
            classes: result2,
        });
    } catch (err) {
        console.error("❌ Error adding section:", err);
        res.status(500).render("instructor/index", {
            id: userid,
            errState: true,
            message: "Cannot add section (500)",
            courses: [],
            classes: [],
        });
    }
});

router.post("/delete/section", checkAuth, async (req, res) => {
    const { section_id, course_id } = req.body;
    const userid = req.session.user.id;

    try {
        await db.query("DELETE FROM classes WHERE class_id = ? AND class_course = ?", [section_id, course_id]);

        const [result1] = await db.query("SELECT * FROM courses WHERE ins_id = ?", [userid]);
        const [result2] = await db.query("SELECT * FROM classes WHERE class_ins = ?", [userid]);

        res.status(200).render("instructor/index", {
            id: userid,
            errState: false,
            message: "Delete section successful",
            courses: result1,
            classes: result2,
        });
    } catch (err) {
        console.error("❌ Error deleting section:", err);
        res.status(500).render("instructor/index", {
            id: userid,
            errState: true,
            message: "Cannot delete section (500)",
            courses: [],
            classes: [],
        });
    }
});

module.exports = router;