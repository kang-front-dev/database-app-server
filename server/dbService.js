const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let instance = null;
dotenv.config();
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) {
    console.log(err.message);
  }
  console.log('database ' + connection.state);
});

class DBService {
  static getDbServiceInstance() {
    return instance ? instance : new DBService();
  }

  async getAllData() {
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

  async regUserData(data) {
    try {
      const alreadyExist = await this.findUser(data.email, true);
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

  async findUser(email, returnInfo) {
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

  async authUser(userData) {
    try {
      let userDbInfo = await this.findUser(userData.email, true);
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
        return {message: 'User is blocked'};
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
      return response.affectedRows ? {token: token,email: userData.email,id: userDbInfo.id,} : false;
    } catch (err) {
      console.log(err);
    }
  }
  async blockUser(userData) {
    try {
      const response = await new Promise((resolve, reject) => {
        const query = `UPDATE users SET status_block=(?) WHERE id=(?)`;
        connection.query(query, [1, userData.id], (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        });
      });
      return response.affectedRows ? true : false;
    } catch (err) {
      console.log(err);
    }
  }
  async unblockUser(userData) {
    try {
      const response = await new Promise((resolve, reject) => {
        const query = `UPDATE users SET status_block=(?) WHERE id=(?)`;
        connection.query(query, [0, userData.id], (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        });
      });
      return response.affectedRows ? true : false;
    } catch (err) {
      console.log(err);
    }
  }
  async deleteUser(userData) {
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
  async checkToken(token) {
    try {
      const tokenOpened = jwt.decode(token);
      console.log(tokenOpened);
      const response = await new Promise((resolve, reject) => {
        const query = `SELECT * FROM users WHERE id=(?)`;
        connection.query(query, [tokenOpened.id], (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        });
      });
      if (response) {
        return tokenOpened.email;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = DBService;
