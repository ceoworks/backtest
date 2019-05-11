const Chart = require('cli-chart');
const Backtest = require('./lib');
const candles = require('./BTC_1H_CANDLES.json');
let signals = require('./signals');
const shortSignals = require('./shortSignals');

signals = Object.values(signals[0]);
const signalsMap = {};
signals.forEach((d) => {
	signalsMap[d.date] = d;
});
Object.assign(signalsMap, shortSignals);
const indicators = [{name: 'rsi', period: 14}, {name: 'ema', period: 50}, {name: 'ema', period: 200}];
const takeProfit = 0.03;
const stopLoss = 0.03;
const backtesting = new Backtest({
	candles, signals: signalsMap, indicators, takeProfit, stopLoss,
});
const result = backtesting.start();
const resultWithoutTrades = {...result, trades: undefined};
console.log('Backtest result:', resultWithoutTrades);
const chart = new Chart({
	xlabel: 'trades',
	ylabel: 'usd',
	direction: 'y',
	width: result.trades.length,
	height: 35,
	lmargin: 5,
	step: 1,
});
result.trades.forEach((trade) => {
	chart.addBar(trade.amount + trade.profit, trade.profit > 0 ? 'green' : 'red');
});

chart.draw();
process.exit();
