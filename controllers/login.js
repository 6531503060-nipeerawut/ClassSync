const db = require("../routes/db-config");
const bcrypt = require("bcryptjs");

const login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).render('login', {
            errState: true,
            message: "กรุณากรอก Email และ Password"
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    
    try {
        const [result] = await db.query(sql, [email]);
        
        if (result.length === 0) {
            return res.status(401).render('login', {
                errState: true,
                message: "This account does not exist yet."
            });
        }

        const user = result[0];
        console.log("User found:", user.email);
        
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).render('login', {
                errState: true,
                message: "Invalid email or password"
            });
        }

        req.session.regenerate(async (err) => {
            if (err) {
                console.error("Session regeneration error:", err);
                return res.status(500).render('login', {
                    errState: true,
                    message: "Session Error"
                });
            }

            req.session.user = {
                email: user.email,
                role: user.role,
                id: user.user_id
            };

            try {
                if (user.role == 1) {
                    console.log("Redirecting to student dashboard");
                    return res.status(200).render('student/index', {
                        name: user.email,
                        id: user.user_id,
                        errState: null,
                        message: null,
                        courses: null
                    });
                    
                } else if (user.role == 2) {
                    console.log("Processing instructor login");
                    const userid = user.user_id;
                    
                    const [coursesResult] = await db.query("SELECT * FROM courses WHERE ins_id = ?", [userid]);
                    const [classesResult] = await db.query("SELECT * FROM classes WHERE class_ins = ?", [userid]);
                    
                    console.log("Courses:", coursesResult.length);
                    console.log("Classes:", classesResult.length);
                    
                    return res.status(200).render('instructor/index', {
                        id: userid,
                        errState: null,
                        message: null,
                        courses: coursesResult,
                        classes: classesResult
                    });
                    
                } else {
                    return res.status(400).render('login', {
                        errState: true,
                        message: "Invalid user role"
                    });
                }
                
            } catch (renderError) {
                console.error("Render error:", renderError);
                return res.status(500).render('login', {
                    errState: true,
                    message: "Error loading dashboard"
                });
            }
        });

    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).render('login', {
            errState: true,
            message: "Server Error - Please try again"
        });
    }
};

module.exports = login;