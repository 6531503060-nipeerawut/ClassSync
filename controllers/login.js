const jwt = require("jsonwebtoken");
const db = require("../routes/db-config");
const bcrypt = require("bcryptjs");

const login = (req, res) => {
    const {email, password} = req.body
    const sql = "SELECT * FROM users WHERE email = ?"

    db.query(sql,[email],(err,result) => {
        if(err) {
            return res.status(401).render("login", {errState:true, message:"This account does not exist yet"})
        }
        const user = result[0]
        
        bcrypt.compare(password, user.password, (err,match) => {
            if(err) {
                return res.render(500).render("login", {errState:true, message:"Server Error"})
            }

            if(!match){
                return res.status(401).render("login", {errState:true, message: "Invalid email or password"})
            }

            req.session.user = {email:user.email, role:user.role, id:user.user_id}
            if(user.role == 1) {
                
                res.status(200).render("student/index", {name:user.email, id:user.user_id, errState:null, message:null})
            }else if(user.role == 2) {
                res.status(200).render("instructor/index", {name:user.email, id:user.user_id, errState:null, message:null})
            }
            
        })
    })
}


module.exports = login;