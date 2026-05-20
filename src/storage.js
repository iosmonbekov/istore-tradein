const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.sqlite');

let db;

function initDb() {
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      uid TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price TEXT NOT NULL,
      price_old TEXT,
      quantity TEXT,
      device_type TEXT,
      last_seen TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      chat_id INTEGER PRIMARY KEY,
      subscribed_at TEXT NOT NULL
    );
  `);
}

function saveSnapshot(products) {
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO products (uid, title, price, price_old, quantity, device_type, last_seen)
    VALUES (@uid, @title, @price, @price_old, @quantity, @device_type, @last_seen)
  `);
  const deleteOld = db.prepare(
    `DELETE FROM products WHERE uid NOT IN (${products.map(() => '?').join(',')})`
  );

  const tx = db.transaction((prods) => {
    for (const p of prods) {
      upsert.run({ ...p, last_seen: now });
    }
    if (prods.length > 0) {
      deleteOld.run(prods.map((p) => p.uid));
    } else {
      db.prepare('DELETE FROM products').run();
    }
  });
  tx(products);
}

function getSnapshot() {
  return db.prepare('SELECT * FROM products ORDER BY device_type, title').all();
}

function addSubscriber(chatId) {
  db.prepare(
    'INSERT OR IGNORE INTO subscribers (chat_id, subscribed_at) VALUES (?, ?)'
  ).run(chatId, new Date().toISOString());
}

function removeSubscriber(chatId) {
  db.prepare('DELETE FROM subscribers WHERE chat_id = ?').run(chatId);
}

function getSubscribers() {
  return db.prepare('SELECT chat_id FROM subscribers').all().map((r) => r.chat_id);
}

function getSubscriberCount() {
  return db.prepare('SELECT COUNT(*) as count FROM subscribers').get().count;
}

module.exports = {
  initDb,
  saveSnapshot,
  getSnapshot,
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  getSubscriberCount,
};
