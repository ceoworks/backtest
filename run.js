const Backtest = require('./lib');
let candles = require('./bitcoin_1H_candles_data.json');
let signals = require('./signals');
signals = Object.values(signals[0]);
const signalsMap = {};
signals.forEach((d) => {
	signalsMap[d.date] = d;
});
// candles = require('lodash').uniqWith(candles, (a, b) => a[0] === b[0])

const backtesting = new Backtest(candles, signalsMap);
const result = backtesting.start();
