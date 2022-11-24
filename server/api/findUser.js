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
