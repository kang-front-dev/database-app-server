const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');

const mysql = require('mysql');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// create
app.post('/insert', async (request, response) => {
  console.log(request.body, 'request body REGISTER');
  const result = regUserData(request.body);
  result
    .then((res) => {
      if (res.message === 'Email already exists') {
        return response.status(401).json({ success: false });
      }
      return response
        .status(200)
        .json({ success: true, email: res.email, id: res.insertId });
    })
    .catch((err) => {
      console.log(err);
    });
});

// read
app.get('/getAll', (request, response) => {
  const result = getAllData();

  result
    .then((data) => response.json({ data: data }))
    .catch((err) => console.log(err));
});

// update

app.patch('/checkToken', (request, response) => {
  const result = checkToken(request.body.token);

  result
    .then((email) => {
      console.log(email, 'email');
      return response.json({ email: email });
    })
    .catch((err) => console.log(err));
});

app.patch('/authUser', (request, response) => {
  console.log(request.body, 'request body AUTH');
  const result = authUser(request.body);

  result
    .then((res) => {
      console.log(res, 'res');
      if (res.token) {
        return response.json({
          token: `Bearer ${res.token}`,
          email: res.email,
          id: res.id,
          success: true,
        });
      } else {
        return response
          .status(401)
          .json({ success: false, message: res.message });
      }
    })
    .catch((err) => console.log(err));
});
app.patch('/blockUser', (request, response) => {
  // console.log(request.body,'request body BLOCK');
  const result = blockUser(request.body);

  result
    .then((res) => {
      if (res) {
        return response.json({ success: res });
      } else {
        return response.status(404).json({ success: res });
      }
    })
    .catch((err) => console.log(err));
});
app.patch('/unblockUser', (request, response) => {
  const result = unblockUser(request.body);

  result
    .then((res) => {
      if (res) {
        return response.json({ success: res });
      } else {
        return response.status(404).json({ success: res });
      }
    })
    .catch((err) => console.log(err));
});

// delete

app.delete('/deleteUser', (request, response) => {
  const result = deleteUser(request.body);

  result
    .then((res) => {
      if (res) {
        return response.json({ success: res });
      } else {
        return response.status(404).json({ success: res });
      }
    })
    .catch((err) => console.log(err));
});

app.listen(process.env.PORT, () => {
  console.log('app is running');
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
async function checkToken(token) {
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
async function unblockUser(userData) {
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
async function blockUser(userData) {
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
