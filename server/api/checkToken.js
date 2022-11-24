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
module.exports = checkToken