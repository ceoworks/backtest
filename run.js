const Backtest = require('./lib');
const candles = require('./BTC_1H_CANDLES.json');
const {ema200Strategy} = require('./strategies');
const drawChart = require('./lib/util/drawChart');

const indicators = [
	{name: 'rsi', period: 14},
	{name: 'ema', period: 50},
	{name: 'ema', period: 200},
];
const takeProfit = 0.1;
const stopLoss = 0.03;
const backtesting = new Backtest({
	candles, strategy: ema200Strategy, indicators, takeProfit, stopLoss,
});
const result = backtesting.start();
drawChart(result);
process.exit();
