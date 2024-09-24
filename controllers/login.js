const jwt = require("jsonwebtoken");
const db = require("../routes/db-config");
const bcrypt = require("bcryptjs");

const login = (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";

    try {
        db.query(sql, [email], async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).render('login', { errState: true, message: "Server Error" });
            }

            if (result.length === 0) {
                return res.status(401).render('login', { errState: true, message: "This account does not exist yet." });
            }

            const user = result[0];
            console.log(user)
            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.status(401).render('login', { errState: true, message: "Invalid email or password" });
            }

            req.session.regenerate((err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).render('login', { errState: true, message: "Session Error" });
                }

                req.session.user = { email: user.email, role: user.role, id:user.user_id };

                if (user.role == 1) {
                    
                    return res.status(200).render('student/index', { name: user.email, id:user.user_id ,errState:null,message:null,courses:null});
                } else if (user.role == 2) {
                    const userid = req.session.user.id; 
                    db.query("SELECT * FROM courses WHERE ins_id = ?", [userid], (err, result) => {
                        if (err) {
                            console.error("Error fetching courses:", err);
                            return res.status(500).render('instructor/index', { id: userid, errState: true, message: "Cannot query from server (500)", courses: null });
                        }
                        db.query("SELECT * FROM classes WHERE class_ins = ?")
                        res.status(200).render('instructor/index', { id: userid, errState: null, message: null, courses: result });
                    });
                }
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render('login', { errState: true, message: "Server Error" });
    }
};


module.exports = login;