const { getDB, getUserID } = require('../database.js');

const getLastRush = async (user) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  let result = await db.get(`SELECT last_rush FROM rush_claim WHERE user=?`, user_id);
  // If user doesn't exist yet, set them up
  if (!result) {
    await db.run(`INSERT OR REPLACE INTO rush_claim (user) VALUES (?)`, user_id);
    // try get the users points again
    result = await db.get(`SELECT last_rush FROM rush_claim WHERE user=?`, user_id);
  }
  db.close();
  const { last_rush = 0 } = result;

  return { last_rush: new Date(last_rush) };
};

const updateRushDate = async (user) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  const data = {
    $user_id: user_id,
    $date: new Date().toJSON(),
  };

  await db.run(`UPDATE rush_claim SET last_rush=$date WHERE user=$user_id`, data);
  db.close();
};

module.exports = {
  getLastRush,
  updateRushDate,
};
