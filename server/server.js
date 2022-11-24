const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');

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

const getAllData = require('./api/getAll');
const checkToken = require('./api/checkToken');
const deleteUser = require('./api/deleteUser');
const blockUser = require('./api/block');
const unblockUser = require('./api/unblock');
const authUser = require('./api/log');
const regUserData = require('./api/reg');

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
