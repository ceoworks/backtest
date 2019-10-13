const Backtest = require('./lib');
const candles = require('./bitfinex_BTCUSD_15m.json');
const {ema200Strategy} = require('./strategies');
const drawChart = require('./src/util/drawChart');

const indicators = [
	{name: 'rsi', period: 14},
	{name: 'ema', period: 9},
	{name: 'ema', period: 21},
	{
		name: 'stochasticrsi',
		period: 14,
		rsiPeriod: 14,
		stochasticPeriod: 14,
		kPeriod: 3,
		dPeriod: 3,
	},
	// {name: 'adx', period: 14},
	{name: 'bollingerbands', period: 14, stddev: 2},
];
const takeProfit = 0.05;
const stopLoss = 0.04;
const backtesting = new Backtest({
	candles, strategy: ema200Strategy, indicators, takeProfit, stopLoss,
});
const result = backtesting.start();
drawChart(result);
process.exit();
