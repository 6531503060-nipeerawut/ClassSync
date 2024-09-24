const express = require("express");
const app = express()
const router = express.Router();
const db = require("../routes/db-config");

const checkAuth = (req,res,next) => {
    if(req.session.user) {
        return next()
    } else {
        return res.status(401).render('login', {errState:true, message: "Please login first"})
    }
}

router.get("/", checkAuth, (req,res) => {
    const userid = req.session.user.id
    res.render("instructor/index", {id:userid, errState:null, message:null})
})
router.get('/course',checkAuth, (req, res) => {
    const userid = req.session.user.id;

    db.query("SELECT * FROM courses WHERE ins_id = ?", [userid], (err, result) => {
        if (err) {
            return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Cannot refresh from server (500)", courses: null });
        }
        console.log(result)
        res.status(200).render('instructor/index', { id: userid, errState: false, message: "Refresh Success", courses: result });
    });
});
router.get('/del/:id', (req, res) => {
    const userid = req.session.user.id;
    const delID = req.params.id;

    const sqlDel = "DELETE FROM courses WHERE course_id = ? AND ins_id = ?"; // Check both course ID and instructor ID
    db.query(sqlDel, [delID, userid], (err, result) => {
        if (err) {
            return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Cannot delete the course (500)", courses: [] });
        }

        const sqlFetchCourses = "SELECT * FROM courses WHERE ins_id = ?";
        db.query(sqlFetchCourses, [userid], (fetchErr, courses) => {
            if (fetchErr) {
                return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Cannot fetch courses after deletion (500)", courses: [] });
            }

            return res.status(200).render('instructor/index', { id: userid, errState: false, message: "Delete Success", courses: courses });
        });
    });
});

router.post('/course', (req, res) => {
    const { courseCode, courseName, courseCredit } = req.body;
    const userid = req.session.user.id;

    const addCourse = "INSERT INTO courses (course_code, course_name, course_credit, ins_id) VALUES (?, ?, ?, ?)";

    db.query(addCourse, [courseCode, courseName, courseCredit, userid], (err, result) => {
        if (err) {
            console.error("Error adding course:", err);
            return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Server Error (500)", courses: null });
        }

        if (result.affectedRows > 0) {
            db.query("SELECT * FROM courses WHERE ins_id = ?", [userid], (err, result) => {
                if (err) {
                    console.error("Error fetching courses:", err);
                    return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Cannot query from server (500)", courses: null });
                }

                return res.status(200).render('instructor/index', { id: userid, errState: false, message: "Course added successfully", courses: result });
            });
        } else {
            return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Failed to add course", courses: null });
        }
    });
});

router.post('/edit/:id', (req, res) => {
    const userid = req.session.user.id;
    const courseID = req.params.id;
    const { course_code, course_name, course_credit } = req.body;

    const sqlUpdate = "UPDATE courses SET course_code = ?, course_name = ?, course_credit = ? WHERE course_id = ? AND ins_id = ?";
    db.query(sqlUpdate, [course_code, course_name, course_credit, courseID, userid], (err, result) => {
        if (err) {
            return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Cannot update the course (500)", courses: [] });
        }


        const sqlFetchCourses = "SELECT * FROM courses WHERE ins_id = ?";
        db.query(sqlFetchCourses, [userid], (fetchErr, courses) => {
            if (fetchErr) {
                return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Cannot fetch courses after update (500)", courses: [] });
            }

            return res.status(200).render('instructor/index', { id: userid, errState: false, message: "Course updated successfully", courses: courses });
        });
    });
});

module.exports = router;