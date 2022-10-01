// File Name – usersdb_conn.js

var mysql = require('mysql');
var usersdb_conn = mysql.createConnection({
  host: 'localhost',
  user: 'dbuser',
  password: 'Password',
  database: 'users'
});
usersdb_conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});
module.exports = usersdb_conn;
 