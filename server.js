require('dotenv').config({ path: '.env.production' });
const express = require("express");
const db = require("./routes/db-config");
const cookie = require("cookie-parser");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4002;

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
    cookie: { secure: false }
}));
app.use((req, res, next) => {
    res.locals.session = req.session.user;
    next();
});

// ✅ ทดสอบ DB connection
db.query('SELECT 1')
  .then(() => console.log('✅ DB connected'))
  .catch((err) => console.error('❌ DB connection failed:', err));

// ✅ route ทดสอบ
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS now');
    res.json({ time: rows[0].now });
  } catch (error) {
    console.error('DB query error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// ✅ routes จริง
app.use("/", require("./routes/pages"));
app.use("/api", require("./controllers/auth"));
app.use("/s", require("./routes/student"));
app.use("/i", require("./routes/instructor"));
app.use("/sd", require('./routes/schedule'));
app.use("/dbd", require('./routes/dashboard'));
app.use("/pf", require("./routes/profile"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});