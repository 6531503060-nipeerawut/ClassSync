require('dotenv').config({ path: '.env.production' });
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 20000
});

module.exports = pool;