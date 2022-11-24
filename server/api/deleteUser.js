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
async function deleteUser(userData) {
  try {
    const response = await new Promise((resolve, reject) => {
      const query = `DELETE FROM users WHERE id=(?)`;
      connection.query(query, [userData.id], (err, results) => {
        if (err) reject(new Error(err.message));
        resolve(results);
      });
    });
    return response.affectedRows ? true : false;
  } catch (err) {
    console.log(err);
  }
}
module.exports = deleteUser