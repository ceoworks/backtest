## Backtest

The easiest way to test some strategies on historical data.

### Features

- Supports historical candles data as .json (`[[timestamp, open, close, high, low, volume], ...]`)
- Trades according to your strategy
- Trades according to signals
- Calculates indicators to be used by strategy
- Supports both `long` and `short` position types
- Supports both `limit` and `market` order types
- Accepts `stopLoss` as option (default `3%`)
- Accepts `takeProfit` as option (default `5%`)
- Accepts `exchangeFee` as option (default `0.2%`)
- Accepts `balanceUSD` as option (default `1000`)
- Shows summary of profits/losses/trades
_ _soon_ Accepts .csv as a source of candles

### Usage

Construct your own `run.js` file with strategy or signals.

#### Use with strategy

Strategy specified by the function. Function receives next arguments:

 - `candleIndex` - will help to pick relevant indicator value
 - `candle` - object with standard `open`, `close`, `high`, `low`, `volume` properties
 - `positionTypes` - object with constants `LONG` and `SHORT`
 - `orderTypes` - object with constants `LIMIT` and `MARKET`

As a result of strategy calculations, order is placed or position is opened.

```
const Backtest = require('./lib');
const candles = require('./BTC_1H_CANDLES.json');
const drawChart = require('./lib/util/drawChart');

const indicators = [
	{name: 'rsi', period: 14},
	{name: 'ema', period: 50},
	{name: 'ema', period: 200},
];
const takeProfit = 0.1;
const stopLoss = 0.03;
function ema200Strategy(candleIndex, candle, positionTypes, orderTypes) {
	const {close, candleTimestamp} = candle;
	const {ema50 = [], ema200 = []} = this.indicators;
	const lastEma50Value = ema50[candleIndex];
	const lastEma200Value = ema200[candleIndex];
	const positionType = lastEma50Value > lastEma200Value
		? positionTypes.LONG : positionTypes.SHORT;
	if (lastEma200Value) {
		const price = lastEma200Value;
		const fillOrKill = true;
		this.placeOrder(
			price,
			positionType,
			orderTypes.LIMIT,
			fillOrKill,
		);
	}
};

const backtesting = new Backtest({
	candles, strategy: ema200Strategy, indicators, takeProfit, stopLoss,
});
const result = backtesting.start();
drawChart(result);
process.exit();
```

#### Use with signals

In case you want to test some signals, which was calculated anywhere else - just format them to object with `key` equal to `candle.timestamp` (candle to execute signal on) and `value` as `{orderType: orderTypes.MARKET, positionType: positionTypes.LONG}` (position will be opened with candle.close price as an entry) or either `{orderType: orderTypes.LIMIT, price: 3458.77, positionType: positionTypes.LONG}` (limit order will be places with specified price)

In case `positionType` is missed - it defaults to `positionTypes.LONG`

Example of `run.js` file

```
const Backtest = require('./lib');
const candles = require('./BTC_1H_CANDLES.json');
let signals = require('./signals');
const drawChart = require('./lib/util/drawChart');

const takeProfit = 0.1;
const stopLoss = 0.03;
const backtesting = new Backtest({
	candles, takeProfit, stopLoss, signals: signalsMap,
});
const result = backtesting.start();
drawChart(result);
process.exit();
```

Example of `market signals`

```
{
	1365706800000: {positionType: 'long', orderType: 'market'},
	1366099200000: {positionType: 'short', orderType: 'market'},
	...
}
```
Example of `limit signals`

```
{
	1365706800000: {positionType: 'long', orderType: 'limit', price: 3458.77},
	1366099200000: {positionType: 'short', orderType: 'limit', price: 4210.77},
	...
}
```

#### Candles format

Candles must be an array with next format:

```
[
  [
    1534942800000,
    6664.6,
    6665,
    6676.72752826,
    6650.7,
    470.42768294
  ],
  [
    1534946400000,
    6665,
    6654.1,
    6669.1,
    6638.4,
    412.41398936
  ],
	...
]
```

Fetch candles for crypto of your interest with [Cryptofetcher](https://github.com/ceoworks/cryptofetcher)
