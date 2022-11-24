const mysql = require('mysql');

const connectionConfig = {
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
};
const connection = mysql.createConnection(connectionConfig);

connection.connect((err) => {
  if (err) {
    console.log(err.message, 'connection err');
  }
  console.log('database ' + connection.state);
});
async function findUser(email, returnInfo) {
  try {
    const response = await new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE email=(?)`;
      connection.query(query, [email], (err, results) => {
        if (err) reject(new Error(err.message));
        resolve(results);
      });
    });
    if (response.length !== 0) {
      if (returnInfo) {
        return response[0];
      }
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
  }
}
module.exports = findUser
