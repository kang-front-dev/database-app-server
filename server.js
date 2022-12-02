const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const client = new MongoClient(
  'mongodb+srv://admin:admin@cluster0.vcewazx.mongodb.net/?retryWrites=true&w=majority'
);

const startMongo = async () => {
  try {
    await client.connect();

    console.log('Database connected!');
  } catch (error) {
    console.log(error);
  }
};
startMongo();
const users = client.db('database-app').collection('users');
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
        return response
          .status(401)
          .json({ success: false, message: res.message });
      } else {
        return response
          .status(200)
          .json({ success: true, email: res.email, id: res.id });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// read
app.get('/getAll', (request, response) => {
  const result = getAllData();

  result
    .then((data) => {
      response.json({ data: data });
    })
    .catch((err) => console.log(err));
});

// update

// app.patch('/checkToken', (request, response) => {
//   const result = checkToken(request.body.token);

//   result
//     .then((email) => {
//       console.log(email, 'email');
//       return response.json({ email: email });
//     })
//     .catch((err) => console.log(err));
// });

app.patch('/authUser', (request, response) => {
  console.log(request.body, 'request body AUTH');
  const result = authUser(request.body);

  result
    .then((res) => {
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
    const response = await users.find();
    return response.toArray();
  } catch (error) {
    console.log(error);
  }
}
// async function checkToken(token) {
//   try {
//     const tokenOpened = jwt.decode(token);
//     console.log(tokenOpened);
//     const response = await new Promise((resolve, reject) => {
//       const query = `SELECT * FROM users WHERE id=(?)`;
//       connection.query(query, [tokenOpened.id], (err, results) => {
//         if (err) reject(new Error(err.message));
//         resolve(results);
//       });
//     });
//     if (response) {
//       return tokenOpened.email;
//     } else {
//       return false;
//     }
//   } catch (err) {
//     console.log(err);
//   }
// }

async function deleteUser(userData) {
  try {
    const id = new ObjectId(userData._id);
    const query = { _id: id };
    const find = await users.findOne(query);
    console.log(find);
    const response = await users.deleteOne(query);
    console.log(response);
    return response.deletedCount ? { success: true } : { success: false };
  } catch (err) {
    console.log(err);
  }
}
async function unblockUser(userData) {
  try {
    const id = new ObjectId(userData._id);
    const query = { _id: id };
    const queryUpdate = {
      $set: {
        statusBlock: 0,
      },
    };
    const response = await users.updateOne(query, queryUpdate);
    return response ? { success: true } : { success: false };
  } catch (err) {
    console.log(err);
  }
}
async function blockUser(userData) {
  try {
    const id = new ObjectId(userData._id);
    const query = { _id: id };
    const queryUpdate = {
      $set: {
        statusBlock: 1,
      },
    };
    const response = await users.updateOne(query, queryUpdate);
    return response ? { success: true } : { success: false };
  } catch (err) {
    console.log(err);
  }
}
async function findUser(email) {
  try {
    const query = { email: email };
    const response = await users.findOne(query);
    console.log(response, 'response from Find');
    return response;
  } catch (err) {
    console.log(err);
  }
}
async function authUser(userData) {
  try {
    console.log(userData);
    let userDbInfo = await findUser(userData.email);
    console.log(userDbInfo, 'userDbInfo');
    if (!userDbInfo) {
      return { success: false, message: 'User does not exist' };
    }
    const passwordResult = bcrypt.compareSync(
      userData.password,
      userDbInfo.password
    );
    if (!passwordResult) {
      return { success: false, message: 'Wrong password' };
    }
    const query = { email: userData.email };
    const queryUpdate = {
      $set: {
        logDate: userData.logDate,
      },
    };
    const response = users.updateOne(query, queryUpdate);
    if (userDbInfo.statusBlock === 1) {
      return { success: false, message: 'User is blocked' };
    }
    const token = jwt.sign(
      {
        email: userData.email,
        id: userDbInfo._id,
      },
      process.env.JWT_KEY,
      {
        expiresIn: 60 * 60,
      }
    );
    console.log(response, 'response from Login');

    return response
      ? {
          success: true,
          token: token,
          email: userData.email,
          id: userDbInfo._id,
        }
      : {
          success: false,
          message: 'Unknown error',
        };
  } catch (err) {
    console.log(err);
  }
}

async function regUserData(data) {
  try {
    const alreadyExist = await findUser(data.email);
    if (alreadyExist) {
      return { message: 'Email already exists' };
    }
    const salt = bcrypt.genSaltSync(10);
    data.password = bcrypt.hashSync(data.password, salt);

    const response = await users.insertOne(data);
    return response.acknowledged
      ? { success: true, email: data.email, id: response.insertedId.toString() }
      : { success: false, message: 'Unknown error' };
  } catch (err) {
    console.log(err, 'error');
    return err;
  }
}
