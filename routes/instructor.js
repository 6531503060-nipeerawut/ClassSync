const express = require("express");
const app = express()
const router = express.Router();

const checkAuth = (req,res,next) => {
    if(req.session.user) {
        return next()
    } else {
        return res.status(401).render('login', {errState:true, message: "Please login first"})
    }
}

router.get("/home", checkAuth, (req,res) => {
    res.render("staff/index", {name:null})
})

module.exports = router;