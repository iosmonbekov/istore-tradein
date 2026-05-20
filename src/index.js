require('dotenv').config();

const storage = require('./storage');
const scraper = require('./scraper');
const notifier = require('./notifier');
const { createBot } = require('./bot');
const { runCheck, startScheduler } = require('./scheduler');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not set in .env');
  process.exit(1);
}

storage.initDb();
const bot = createBot(BOT_TOKEN, storage, scraper);

bot.launch().then(() => {
  console.log('Bot started');
  runCheck(bot, storage, scraper, notifier);
  startScheduler(bot, storage, scraper, notifier);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
