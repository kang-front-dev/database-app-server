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
module.exports = deleteUser