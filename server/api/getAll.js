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
