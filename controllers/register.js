const db = require("../routes/db-config");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  const { id, fullName, email, password, school, phone, role } = req.body;

  console.log("REQ.BODY:", req.body);

  if (!email || !password || !fullName || !id || !school || !phone || !role) {
    return res.status(400).render("register", {
      errState: true,
      message: "All fields are required"
    });
  }

  try {
    const hashPassword = await bcrypt.hash(password, 10);
    const userSQL = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";

    db.query(userSQL, [email, hashPassword, role], (err, result) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).render("register", { errState: true, message: "Register Failed" });
      }

      const userID = result.insertId;

      if (role == 1) {
        const studentSQL =
          "INSERT INTO students(user_id, student_uid, full_name, student_school, student_phone) VALUES (?, ?, ?, ?, ?)";
        db.query(studentSQL, [userID, id, fullName, school, phone], (err) => {
          if (err) {
            console.error("Student Insert Error:", err);
            return res.status(500).render("register", { errState: true, message: "Register Failed (Student)" });
          }
          return res.status(200).render("login", { name: fullName, errState: false, message: "Register Success" });
        });
      } else if (role == 2) {
        const instructorSQL =
          "INSERT INTO instructors(user_id, ins_uid, full_name, ins_school, ins_phone) VALUES (?, ?, ?, ?, ?)";
        db.query(instructorSQL, [userID, id, fullName, school, phone], (err) => {
          if (err) {
            console.error("Instructor Insert Error:", err);
            return res.status(500).render("register", { errState: true, message: "Register Failed (Instructor)" });
          }
          return res.status(200).render("login", { name: fullName, errState: false, message: "Register Success" });
        });
      }
    });
  } catch (err) {
    console.error("Bcrypt Error:", err);
    return res.status(500).render("register", { errState: true, message: "Error hashing password" });
  }
};

module.exports = register;