const cron = require('node-cron');

async function runCheck(bot, storage, scraper, notifier) {
  console.log(`[${new Date().toISOString()}] Running product check...`);
  try {
    const [oldProducts, newProducts] = await Promise.all([
      Promise.resolve(storage.getSnapshot()),
      scraper.fetchProducts(),
    ]);

    console.log(`Fetched ${newProducts.length} products from API`);

    const isFirstRun = oldProducts.length === 0;
    const changes = notifier.detectChanges(oldProducts, newProducts);
    storage.saveSnapshot(newProducts);

    if (isFirstRun) {
      console.log('First run — snapshot saved, no notifications sent');
      return;
    }

    if (notifier.hasChanges(changes)) {
      const subscribers = storage.getSubscribers();
      console.log(
        `Changes detected: +${changes.added.length} new, ${changes.priceChanged.length} price changes, -${changes.removed.length} removed`
      );
      if (subscribers.length > 0) {
        const sent = await notifier.notifyAll(bot, subscribers, changes);
        console.log(`Notifications sent to ${sent}/${subscribers.length} subscribers`);
      } else {
        console.log('No subscribers to notify');
      }
    } else {
      console.log('No changes detected');
    }
  } catch (err) {
    console.error('Error during product check:', err.message);
  }
}

function startScheduler(bot, storage, scraper, notifier) {
  // every 12 hours at minute 0
  cron.schedule('*/10 * * * *', () => {
    runCheck(bot, storage, scraper, notifier);
  });
  console.log('Scheduler started — checks every 10 minutes');
}

module.exports = { runCheck, startScheduler };
