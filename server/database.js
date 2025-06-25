//         database.js
//
// handles all database operations

import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

// setup database connection
const DATABASE_URI = new URL(process.env.DATABASE_URI);
const pool = new Pool({
  user: DATABASE_URI.username,
  host: DATABASE_URI.host.split(":")[0],
  database: DATABASE_URI.pathname.slice(1),
  password: DATABASE_URI.password,
  port: DATABASE_URI.port,
  max: 20,
  idleTimeoutMillis: 30_000,
  ssl: {
    // TODO: remove this in production (SECURITY RISK)
    rejectUnauthorized: false,
  },
});

delete DATABASE_URI.password;

async function queryDatabase(query, params = []) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(query, params);
    return result.rows;
  } catch (e) {
    console.error(e);
  } finally {
    if (client) client.release();
  }
}

// high-level db functions
export async function authenticateLogin(username, password) {
  if (!username || !password) return false;
  return (
    await queryDatabase("SELECT * FROM AUTHENTICATE($1, $2)", [
      username,
      password,
    ])
  )[0].authenticate;
}

export async function getUserDataFromId(userId) {
  return (
    (
      await queryDatabase(
        "SELECT user_id, username, user_created_at FROM users WHERE user_id = $1",
        [userId],
      )
    )[0] || null
  );
}

export async function getUserDataFromUsername(username) {
  if (!username) return null;
  const result = await queryDatabase(
    "SELECT user_id, username, user_created_at FROM users WHERE username = $1",
    [username],
  );
  if (result.length === 0) return null; // user not found
  return result[0];
}

export async function getUserFriends(user_id) {
  return await queryDatabase("SELECT * FROM GET_FRIENDS($1)", [user_id]);
}

export async function getUserchats(userId) {
  let chats = await queryDatabase("SELECT * FROM GET_CHATS($1)", [userId]);
  return chats.map((i) => {
    return {
      message: i.message_text,
      to: i.recever_id,
      from: i.sender_id,
      sent_at: i.sent_at,
    };
  });
}

export async function saveMessage(message, to, from) {
  await queryDatabase("CALL ADD_MESSAGE($1, $2, $3)", [message, from, to]);
}

// handle SIGINT
export async function onSIGINT() {
  await pool.end();
  console.log("Pool has ended");
}

process.on("SIGINT", onSIGINT);
