# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Run the bot
node src/index.js  # Same as above
```

There are no tests or linter configured. To manually test scraper or logic without a bot token:

```bash
node -e "require('./src/scraper').fetchProducts().then(p => console.log(p.length, p[0]))"
```

## Architecture

The bot is split into five independent modules wired together in `src/index.js`:

- **scraper.js** — Calls the Tilda store JSON API (not scraping HTML) to fetch the current product list. The API URL and store params (`storepartuid`, `recid`) are hardcoded constants. Products are normalized here: `device_type` is extracted from the `characteristics` array by looking for the entry with `title === 'Устройство'`.

- **storage.js** — Thin wrapper around a single SQLite file (`data/db.sqlite`). Holds two tables: `products` (the latest snapshot, keyed by Tilda `uid`) and `subscribers` (Telegram `chat_id`s). `saveSnapshot()` is a full replace — it upserts all current products and deletes any UIDs no longer in the API response, atomically in one transaction.

- **notifier.js** — Pure diff logic. `detectChanges(old, new)` compares two flat arrays keyed by `uid` and returns `{ added, priceChanged, removed }`. `notifyAll()` fans out to all subscriber chat IDs using `Promise.allSettled` so one failed send doesn't block others.

- **scheduler.js** — Exports `runCheck(bot, storage, scraper, notifier)`, which is the single entry point for one full check cycle. On first run (empty snapshot), it saves the baseline and skips notifications. `startScheduler()` wraps this in a `node-cron` at `0 */12 * * *`.

- **bot.js** — Telegraf command handlers. `/check` triggers `runCheck()` manually. All user-facing text is in Russian. Timezone for display is `Asia/Bishkek`.

**Data flow:** `index.js` → `bot.launch()` → immediate `runCheck()` → `scraper.fetchProducts()` + `storage.getSnapshot()` in parallel → `notifier.detectChanges()` → `storage.saveSnapshot()` → `notifier.notifyAll()` if changes exist.

## Key Details

- The Tilda API `c` param is a cache-buster timestamp added at request time; the static params never change unless iStore migrates their store.
- Product identity for diffing is the Tilda `uid` (string), not the title. Title/price changes on the same UID are detected as `priceChanged`, not add+remove.
- `storage.initDb()` must be called before any other storage function. It's called once at startup in `index.js`.
- The SQLite DB module (`better-sqlite3`) is synchronous; all storage calls are blocking.
- Bot messages use Telegram's `Markdown` parse mode (not `MarkdownV2`).
