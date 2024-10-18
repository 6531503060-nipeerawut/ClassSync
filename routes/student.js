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
  const query = `
      SELECT enrollments.*, courses.*, classes.*
      FROM enrollments
      JOIN classes ON enrollments.enroll_class = classes.class_id
      JOIN courses ON classes.class_course = courses.course_id
      WHERE enrollments.enroll_student = ?
  `;

  db.query(query, [userID], (err, results) => {
      if (err) return res.status(500).send({ message: err });

      
      const isEnrolled = results.some(enrollment => 
          enrollment.course_code === courseCode 
      );

      if (isEnrolled) {
          return res.status(400).json({ message: 'Student is already enrolled in this course and section.' });
      }

      
      next()
  })
}

router.get("/", checkAuth, (req, res) => {
  res.render("student/index", { name: null })
})

router.get('/join', checkAuth, (req, res) => {
  res.render('student/join')
  
})

router.get('/class/join',(req,res)=>{
  const userID = req.session.user.id
  const query = `
       SELECT enrollments.*, courses.*, classes.*
      FROM enrollments
      JOIN classes ON enrollments.enroll_class = classes.class_id
      JOIN courses ON classes.class_course = courses.course_id
      WHERE enrollments.enroll_student = ?`
  db.query(query,[userID],(err,result)=>{
    if (err) return res.status(500).send({ message: err })
    res.status(200).json({data:result})
  })

})

router.post('/check/join', checkAuth,checkAlreadyEnroll, (req, res) => {
  const {courseCode,courseSection,coursePassword} = req.body;
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

router.post('/join', checkAuth,checkAlreadyEnroll, (req, res) => {
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


module.exports = router;