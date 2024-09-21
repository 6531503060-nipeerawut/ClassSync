const express = require("express");
const app = express()
const loggedIn = require("../controllers/loggedIn");
const logout = require("../controllers/logout");
const register = require("../controllers/register");
const login = require("../controllers/login");
const router = express.Router();
const createCourses = require("../controllers/createCourses");

// main route
router.get("/", loggedIn, (req, res) => {
    if (req.user) {
        res.render("index", { status: "loggedIn", user: req.user });
    } else {
        res.render("index", { status: "no", user: "nothing"});
    }
});
router.get("/register", (req, res) => {
    res.render("register", {errState:null, message:null});
});
router.get("/login", (req, res) => {
    res.render("login", {errState:null, message:null});
});
router.get("/courses", (req, res) => {
    res.render("staff/addCourse", {errState:null, message:null})
});
router.get("/logout", logout)

router.post("/register", register);
router.post("/login", login);
router.post("/courses", createCourses);
module.exports = router;