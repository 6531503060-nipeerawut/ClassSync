const express = require("express");
const db = require("./routes/db-config");
const app = express();
const cookie = require("cookie-parser");
const PORT = process.env.PORT || 5001;

app.use("/js", express.static(__dirname + "./public/js"))
app.use("/css", express.static(__dirname + "./public/css"))
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(cookie());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
db.connect((err) => {
    if (err) throw err;
    console.log("MySQL CONNECTED");
})
app.use("/", require("./routes/pages"));
app.use("/api", require("./controllers/auth"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});