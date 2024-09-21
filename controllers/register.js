const db = require("../routes/db-config");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
    const { id, fullName, email, password, school, phone, role } = req.body
    const hashPassword = await bcrypt.hash(password, 10)
    const userSQL = "INSERT INTO users (email, password, role) VALUES(?,?,?)"

    db.query(userSQL,[email, hashPassword, role],(err,result) => {
        if(err) {
            return res.status(401).render("register", {errState:true, message:"Register Failed"})
        }

        if(result.length > 0) {
            return res.render('register', {errState:true, message:"Email already exists"})
        }
        const userID = result.insertId

        if(role == 1) {
            const studentSQL = "INSERT INTO students(user_id, student_uid, full_name, student_school, student_phone) VALUES(?,?,?,?,?)"
            db.query(studentSQL,[userID, id, fullName, school, phone], (err,result) => {
                if(err) {
                    return res.status(401).render("register",{errState:true, message:"Register Failed(1)"})
                }
                return res.status(200).render("student/index", {name:fullName})
            })
        } else if (role == 2) {
            const instructorSQL = "INSERT INTO instructors(user_id, ins_uid, full_name, ins_school, ins_phone) VALUES(?,?,?,?,?)"
            db.query(instructorSQL,[userID, id, fullName, school, phone], (err,result) => {
                if(err) {
                    return res.status(401).render("register",{errState:true, message:"Register Failed(2)"})
                }
                return res.status(200).render("staff/index", {name:fullName})
            })
        }
    })
}
module.exports = register;