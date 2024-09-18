const db = require("../routes/db-config");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
    const { email, password, full_name, studentID, school, telephone_number } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
        return res.render('register', { error: true, message: "Please enter your Email and Password" });
    }

    // Check if email is already registered
    db.query('SELECT email FROM users WHERE email = ?', [email], async (err, result) => {
        if (err) throw err;
        
        if (result.length) {
            return res.render('register', { error: true, message: "This email have already exist" });
        } else {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 8);
            
            // Insert the new user into the database
            db.query('INSERT INTO users SET ?', { email: email, password: hashedPassword, FullName: full_name, StudentID: studentID, School: school, TelephoneNumber: telephone_number }, (error, results) => {
                if (error) throw error;
                
                return res.render('index', { status: "loggedIn", user: "User" });
            });
        }
    });
};

module.exports = register;