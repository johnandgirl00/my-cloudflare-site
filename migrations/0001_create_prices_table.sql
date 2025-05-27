CREATE TABLE IF NOT EXISTS coin_prices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_id     TEXT    NOT NULL,
  symbol      TEXT    NOT NULL,
  price_usd   REAL    NOT NULL,
  fetched_at  DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', '_
