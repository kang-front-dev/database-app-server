const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const findUser = require('./findUser')

async function authUser(userData) {
  try {
    let userDbInfo = await findUser(userData.email, true);
    if (!userDbInfo) {
      return false;
    }
    const passwordResult = bcrypt.compareSync(
      userData.password,
      userDbInfo.password
    );
    if (!passwordResult) {
      return false;
    }
    const response = await new Promise((resolve, reject) => {
      const query = `UPDATE users SET log_date=(?) WHERE email=(?)`;
      connection.query(
        query,
        [userData.lastLoginDate, userData.email],
        (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        }
      );
    });
    if (userDbInfo.status_block === 1) {
      return { message: 'User is blocked' };
    }
    const token = jwt.sign(
      {
        email: userData.email,
        id: userDbInfo.id,
      },
      process.env.JWT_KEY,
      {
        expiresIn: 60 * 60,
      }
    );
    return response.affectedRows
      ? { token: token, email: userData.email, id: userDbInfo.id }
      : false;
  } catch (err) {
    console.log(err);
  }
}
module.exports = authUser
