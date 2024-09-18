const express = require("express");
const loggedIn = require("../controllers/loggedIn");
const logout = require("../controllers//logout");
const router = express.Router();

router.get("/", loggedIn, (req, res) => {
    if (req.user) {
        res.render("index", { status: "loggedIn", user: req.user });
    } else {
        res.render("index", { status: "no", user: "nothing"});
    }
});
router.get("/register", (req, res) => {
    res.render("register", {error: false, message: ""});
});
router.get("/login", (req, res) => {
    res.render("login", {error: false, message: ""});
});

router.post("/logout", logout);
module.exports = router;