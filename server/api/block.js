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
module.exports = blockUser