## Backtest

The easiest way to test some strategies on historical data.

### Features

- Supports historical candles data as .json (`[[timestamp, open, close, high, low, volume], ...]`)
- Trades according to signals (`{timestamp}`), takes `candle.low` as entry price by default
- Supports both `long` and `short` position types
- Accepts `stopLoss` as option (default `3%`)
- Accepts `takeProfit` as option (default `5%`)
- Accepts `exchangeFee` as option (default `0.2%`)
- Accepts `balanceUSD` as option (default `1000`)
- Shows summary of profits/losses/deals
- Calculates indicators to be used by strategy
- _soon_ Accepts strategy
_ _soon_ Accepts .csv

### Usage

See `run.js` file
