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
router.get("/course", (req,res) =>{
    const userid = req.session.user.id
    db.query("SELECT * FROM courses", (err,result) => {
        if (err) {
            return res.status(500).render("instructor/index", {id:userid, errState:null, message:"Can not query from server(500)"})
        }
    })
})

router.post("/course", (req,res) => {
    const { id, courseCode, courseName, courseCredit } = req.body

    const userid = req.session.user.id
    const addCourse = "INSERT INTO courses(course_code, course_name, course_credit, ins_id) VALUES(?,?,?,?)"
    db.query(addCourse, [courseCode, courseName, courseCredit,userid], (err, result) => {
        if (err) {
            console.error("Error adding course:", err);
            return res.status(500).render('instructor/index', { id:userid,errState:true,message: "Server error" });
        }

        if (result.affectedRows > 0) {
            return res.status(201).render('instructor/index', { id:userid,errState:false, message: "Course added successfully" });
        } else {
            return res.status(500).render('instructor/index', { id:userid,errState:true,message: "Failed to add course" });
        }
    });
})

module.exports = router;