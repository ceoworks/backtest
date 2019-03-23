const Backtest = require('./lib');
let candles = require('./BTC_1H_CANDLES.json');
let signals = require('./signals');
signals = Object.values(signals[0]);
const signalsMap = {};
signals.forEach((d) => {
	signalsMap[d.date] = d;
});

const backtesting = new Backtest(candles, signalsMap);
const result = backtesting.start();
