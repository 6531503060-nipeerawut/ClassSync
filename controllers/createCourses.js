const db = require("../routes/db-config");
const createCourses = async(req, res) => {
    const { courseID, courseName, courseCredit } = req.body
    const sql = "INSERT INTO courses(course_id, course_name, course_credit) VALUE(?,?,?)"
    db.query(sql, [courseID, courseName, courseCredit], (err, result) => {
        if(err) {
            console.log("This course already exists", err)
            res.status(500).render("/staff/addCourse", {errState:true, message:"This course already exists"})
        } else {
            res.status(200).render("/staff/addCourse", {errState:false, message:"Added Successfully"})
        }
    })
}

module.exports = createCourses