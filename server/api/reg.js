const bcrypt = require('bcrypt');
const findUser = require('./findUser')
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

async function regUserData(data) {
  try {
    const alreadyExist = await findUser(data.email, true);
    const response = await new Promise(async (resolve, reject) => {
      if (alreadyExist) {
        resolve({
          message: 'Email already exists',
        });
      } else {
        const salt = bcrypt.genSaltSync(10);
        const passHash = bcrypt.hashSync(data.password, salt);

        const query = `INSERT INTO users (name, email, reg_date, log_date, status_block, password) VALUES (?,?,?,?,?,?)`;
        connection.query(
          query,
          [
            data.name,
            data.email,
            data.regDate,
            data.lastLoginDate,
            data.status,
            passHash,
          ],
          (err, results) => {
            if (err) reject(err.message);

            resolve(results);
          }
        );
      }
    });
    console.log(alreadyExist, 'userInfo from findUser');
    return response.affectedRows
      ? { ...response, email: data.email }
      : response;
  } catch (err) {
    console.log(err, 'error');
    return err;
  }
}
module.exports = regUserData
