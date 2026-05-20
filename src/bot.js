const { Telegraf } = require('telegraf');
const { formatPrice } = require('./notifier');

function createBot(token, storage, scraper) {
  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    storage.addSubscriber(ctx.chat.id);
    await ctx.reply(
      '👋 Привет! Я буду уведомлять тебя об изменениях в каталоге Trade-in устройств iStore.\n\n' +
        'Доступные команды:\n' +
        '/products — список всех товаров\n' +
        '/status — статус бота\n' +
        '/stop — отписаться от уведомлений'
    );
  });

  bot.command('stop', async (ctx) => {
    storage.removeSubscriber(ctx.chat.id);
    await ctx.reply('✅ Ты отписался от уведомлений. Напиши /start чтобы подписаться снова.');
  });

  bot.command('products', async (ctx) => {
    const products = storage.getSnapshot();

    if (products.length === 0) {
      await ctx.reply('Каталог пока пуст. Попробуй позже.');
      return;
    }

    const byType = {};
    for (const p of products) {
      const key = p.device_type || 'Другое';
      if (!byType[key]) byType[key] = [];
      byType[key].push(p);
    }

    const lines = ['📱 *Trade-in каталог iStore*\n'];
    for (const [type, items] of Object.entries(byType)) {
      lines.push(`*${type}*`);
      for (const p of items) {
        let line = `• ${p.title} — ${formatPrice(p.price)}`;
        if (p.price_old) line += ` ~~${formatPrice(p.price_old)}~~`;
        lines.push(line);
      }
      lines.push('');
    }
    lines.push(`_Всего товаров: ${products.length}_`);

    await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
  });

  bot.command('status', async (ctx) => {
    const products = storage.getSnapshot();
    const subCount = storage.getSubscriberCount();
    const lastSeen =
      products.length > 0
        ? new Date(products[0].last_seen).toLocaleString('ru-RU', {
            timeZone: 'Asia/Bishkek',
          })
        : 'ещё не было проверок';

    await ctx.reply(
      `ℹ️ *Статус бота*\n\n` +
        `Товаров в каталоге: ${products.length}\n` +
        `Подписчиков: ${subCount}\n` +
        `Последняя проверка: ${lastSeen}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('check', async (ctx) => {
    await ctx.reply('🔄 Запускаю проверку...');
    const { runCheck } = require('./scheduler');
    const notifier = require('./notifier');
    await runCheck(bot, storage, scraper, notifier);
    await ctx.reply('✅ Проверка завершена');
  });

  return bot;
}

module.exports = { createBot };
