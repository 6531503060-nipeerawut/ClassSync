const logout = (req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return res.status(500).send("Error Logging out")
        }
        res.render("login", {errState:false, message:"Logout Success!!"})
    })
}

module.exports = logout;