# iStore Trade-In Notifier

Telegram bot that monitors trade-in product listings on [istore.kg/tradein](https://istore.kg/tradein) and notifies subscribers when prices change or new products appear.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your `BOT_TOKEN` (get one from [@BotFather](https://t.me/BotFather)).

3. **Run**
   ```bash
   npm start
   ```

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Subscribe to notifications |
| `/stop` | Unsubscribe |
| `/products` | View all current trade-in products |
| `/status` | Show last check time and stats |
| `/check` | Manually trigger a product check |

## How It Works

- On startup, fetches the current product catalog from the Tilda store API and saves a snapshot to SQLite.
- Every 12 hours, fetches the catalog again and compares with the saved snapshot.
- If any product is added, removed, or has a price change — all subscribers receive a Telegram notification.
- The SQLite database is stored at `data/db.sqlite`.

## Running in Background (VPS)

Using [pm2](https://pm2.keymetrics.io/):
```bash
npm install -g pm2
pm2 start src/index.js --name istore-notifier
pm2 save
pm2 startup
```
