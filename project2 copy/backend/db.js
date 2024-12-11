const mysql = require('mysql2');

// Create a MySQL connection pool
const db = mysql.createPool({
    host: 'localhost', // Your database host
    user: 'root',      // Your database user
    password: '',      // Your database password
    database: 'test',  // Your database name
    waitForConnections: true,
    connectionLimit: 10, // Maximum number of connections
    queueLimit: 0       // No limit for queueing
});

module.exports = db; // Export the connection pool
