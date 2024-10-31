const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../routes/db-config");
const app = express();

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const checkAuth = (req, res, next) => {
    if (req.session.user) {
        res.locals.session = req.session;
        return next();
    } else {
        return res.status(401).render('login', { errState: true, message: "Please login first" });
    }
};

const checkAlreadyEnroll = (req, res, next) => {
    const { courseCode, courseSection, coursePassword } = req.body;
    const userID = req.session.user.id;
    const query = `SELECT enrollments.*, courses.*, classes.* FROM enrollments JOIN classes ON enrollments.enroll_class = classes.class_id JOIN courses ON classes.class_course = courses.course_id WHERE enrollments.enroll_student = ?`;

    db.query(query, [userID], (err, results) => {
        if (err) return res.status(500).send({ message: err });

        const isEnrolled = results.some(enrollment => enrollment.course_code === courseCode);

        if (isEnrolled) {
        return res.status(400).json({ message: 'Student is already enrolled in this course and section.' });
        } next()
    })
}

router.get("/", checkAuth, (req, res) => {
    res.render("student/index", { name: null })
})

router.get('/join', checkAuth, (req, res) => {
    res.render('student/join')

})

router.get('/checkinout', checkAuth, (req,res) => {
    res.render("student/checkinout")
})

router.get('/class/data/join',(req,res)=>{
    const userID = req.session.user.id;
    const query = `SELECT enrollments.*, courses.*, classes.* FROM enrollments JOIN classes ON enrollments.enroll_class = classes.class_id JOIN courses ON classes.class_course = courses.course_id WHERE enrollments.enroll_student = ?`

    db.query(query,[userID],(err,result)=>{
        if (err) return res.status(500).send({ message: err })
            res.status(200).json({data:result})
    })
})

router.get('/course/:course_id/details', (req,res) => {
    const course_id = req.params.course_id;
    const query = 'SELECT enrollments.*, courses.*, classes.* FROM enrollments JOIN classes ON enrollments.enroll_class = classes.class_id JOIN courses ON classes.class_course = courses.course_id WHERE enrollments.enroll_student = ? AND enrollments.enroll_class = ?'

    db.query(query,[req.session.user.id,course_id], (err,result) => {
        if (err) return res.status(500).send({ message: error})
            res.status(200).render('student/courseDetails',{ data: result})
    })
})


router.post('/check/join', checkAuth, checkAlreadyEnroll, (req, res) => {
    const {courseCode,courseSection,coursePassword} = req.body;
    const sql = `SELECT classes.class_id, courses.course_code, classes.class_section, classes.class_password FROM courses RIGHT JOIN classes ON courses.course_id = classes.class_course WHERE courses.course_code = ? AND classes.class_section = ? AND classes.class_password = ?`;
    
    db.query(sql,[courseCode, courseSection, coursePassword],(err,result)=>{
        if(err){
            console.log(err)
            return res.status(500).json({message:"server error"})
        }
        db.query(sql, [courseCode, courseSection, coursePassword], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Server error" });
            }
            if (result.length > 0) {
          const course = result[0]
  
          if (coursePassword === course.class_password) {
              return res.status(200).json({ message: "Course found (status: Ready to join)" })
          } else {
              return res.status(401).json({ message: "Incorrect Password" })
          }
      } else {
          return res.status(404).json({ message: "Course OR Section Not found" })
      }
  });
  
    
  })
  
})

router.post('/unenroll/',(req,res)=>{
  const {enroll_id} = req.body;
  // console.log(enroll_id)
  const sql = "DELETE FROM enrollments WHERE enroll_id = ?"
  db.query(sql,[enroll_id],(err,result)=>{
    if(err){
      return res.status(500).json({message:"Can't delete this Course"})
    }
    if(result.affectedRows === 1){
      res.status(200).json({message:"Deleted succesfully"})
    }
  })
})

router.post('/join', checkAuth, checkAlreadyEnroll, (req, res) => {
  const {courseCode,courseSection,coursePassword} = req.body;
  const userid = req.session.user.id;
  const sql = `
        SELECT 
            classes.class_id,
            courses.course_code, 
            classes.class_section, 
            classes.class_password 
        FROM 
            courses 
        RIGHT JOIN 
            classes ON courses.course_id = classes.class_course 
        WHERE 
            courses.course_code = ? 
            AND classes.class_section = ? 
            AND classes.class_password = ?
    `;
    db.query(sql,[courseCode, courseSection, coursePassword],(err,result)=>{
    if(err){
      // console.log(err)
      return res.status(500).json({message:"Can not join"})
    }
    if(result.length > 0 ){
      const sql1 = "INSERT INTO enrollments(enroll_class,enroll_student) VALUES(?,?)"
      // console.log(userid)
      db.query(sql1,[result[0].class_id,userid],(err,result)=>{
        if(err){
          console.log(err)
          return res.status(401).json({message:"You're can not join"})
        }

        return res.status(200).json({message:"You're join, Please wait 3 seconds To Reload Courses"})
      })
    }
  })
})

router.post('/checkinout', checkAuth, (req, res) => {
    const user = req.session.user.id;
    const { checks } = req.body;
    const query1 = "SELECT user_id, student_uid, full_name FROM students WHERE user_id = ?";
    const query2 = "SELECT enroll_id FROM enrollments WHERE enroll_student = ?";
    const currentDateTime = new Date();
    const date = currentDateTime.toISOString().split('T')[0];
    const options = { timeZone: 'Asia/Bangkok', hour12: false };
    const time = currentDateTime.toLocaleTimeString('en-US', options);

    if (checks == 1) {
        const checkin = "INSERT INTO participants(check_id, student_id, enrollment_id, par_date, par_time) VALUES(?,?,?,?,?)";

        // First, execute query1 to retrieve student details
        db.query(query1, [user], (err, result1) => {
            if (err) {
                console.error("Error executing query1:", err);
                return res.status(500).render("student/checkinout", { errState: true, message: "Server Error", user: null });
            }
            if (result1.length === 0) {
                return res.status(401).render("student/checkinout", { errState: true, message: "No student found for this user.", user: null });
            }
            const studentId = result1[0].user_id;

            // Execute query2 to retrieve enrollment ID
            db.query(query2, [studentId], (err, result2) => {
                if (err) {
                    console.error("Error executing query2:", err);
                    return res.status(500).render("student/checkinout", { errState: true, message: "Server Error", user: null });
                }
                if (result2.length === 0) {
                    return res.status(401).render("student/checkinout", { errState: true, message: "No enrollment found for this student.", user: null });
                }
                const enrollmentId = result2[0].enroll_id;

                // Insert check-in record
                db.query(checkin, [checks, studentId, enrollmentId, date, time], (err, result) => {
                    if (err) {
                        console.error("Error during check-in insertion:", err);
                        return res.status(500).render("student/checkinout", { errState: true, message: "Check-in Failed", user: null });
                    }
                    return res.status(200).render("student/checkinout", { errState: false, message: "Check-in Successful", user });
                });
            });
        });

    } else if (checks == 2) {
        const checkout = "INSERT INTO participants(check_id, student_id, enrollment_id, par_date, par_time) VALUES(?,?,?,?,?)";

        // First, execute query1 to retrieve student details
        db.query(query1, [user], (err, result1) => {
            if (err) {
                console.error("Error executing query1:", err);
                return res.status(500).render("student/checkinout", { errState: true, message: "Server Error", user: null });
            }
            if (result1.length === 0) {
                return res.status(401).render("student/checkinout", { errState: true, message: "No student found for this user.", user: null });
            }
            const studentId = result1[0].user_id;

            // Execute query2 to retrieve enrollment ID
            db.query(query2, [studentId], (err, result2) => {
                if (err) {
                    console.error("Error executing query2:", err);
                    return res.status(500).render("student/checkinout", { errState: true, message: "Server Error", user: null });
                }
                if (result2.length === 0) {
                    return res.status(401).render("student/checkinout", { errState: true, message: "No enrollment found for this student.", user: null });
                }
                const enrollmentId = result2[0].enroll_id;

                // Insert check-in record
                db.query(checkout, [checks, studentId, enrollmentId, date, time], (err, result) => {
                    if (err) {
                        console.error("Error during check-in insertion:", err);
                        return res.status(500).render("student/checkinout", { errState: true, message: "Check-out Failed", user: null });
                    }
                    return res.status(200).render("student/checkinout", { errState: false, message: "Check-out Successful", user });
                });
            });
        });
    }
});


module.exports = router;