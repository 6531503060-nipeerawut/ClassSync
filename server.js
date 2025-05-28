const express = require("express");
const db = require("./routes/db-config");
const app = express();
const cookie = require("cookie-parser");
const session = require("express-session");
const path = require("path");
const PORT = process.env.PORT;

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(cookie());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}))
app.use((req, res, next) => {
    res.locals.session = req.session.user;
    next();
})
db.connect((err) => {
    if (err) throw err;
    console.log("MySQL CONNECTED");
})
app.use("/", require("./routes/pages"));
app.use("/api", require("./controllers/auth"));
app.use("/s", require("./routes/student"));
app.use("/i", require("./routes/instructor"));
app.use("/sd",require('./routes/schedule'));
app.use("/dbd",require('./routes/dashboard'));
app.use("/pf", require("./routes/profile"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});