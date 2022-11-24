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

async function getAllData() {
  try {
    const response = await new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users;';

      connection.query(query, (err, results) => {
        if (err) reject(new Error(err.message));
        resolve(results);
      });
    });
    // console.log(response);
    return response;
  } catch (error) {
    console.log(error);
  }
}
module.exports = getAllData
