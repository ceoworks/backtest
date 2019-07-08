/* eslint-disable no-mixed-spaces-and-tabs */
const config = require('../lib/config');
const Backtest = require('../lib');
const candles = require('./mocks/testCandlesLongTakeProfit.json');
const candlesStopLoss = require('./mocks/testCandlesLongStopLoss.json');
const candlesShort = require('./mocks/testCandlesShortTakeProfit.json');
const candlesShortStopLoss = require('./mocks/testCandlesShortStopLoss.json');
const candlesLongLimitOrder = require('./mocks/testCandlesLongLimitOrder.json');
const candlesIndicators = require('./mocks/testCandlesIndicators.js');
const signalsLong = require('./mocks/getSignals')();
const signalsShort = require('./mocks/getSignals')(config.positionTypes.SHORT);
const expectedRsi14 = require('./asserts/rsi14');
const expectedEma50 = require('./asserts/ema50');
const expectedEma200 = require('./asserts/ema200');

test('long takeprofit should work fine', () => {
	const backtesting = new Backtest({candles, signals: signalsLong});
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 1045.9,
		stopLoss: 0.03,
		takeProfit: 0.05,
		positionEntry: 3437.56909222,
		maximumBalance: 1045.9,
		minimumBalance: 1000,
		positionType: 'none',
		profitTrades: 1,
		unprofitTrades: 0,
		totalTrades: 1,
		trades:
		 [{
		 	type: 'long',
		 	entry: 3437.56909222,
		 	stopLoss: 0.03,
		 	takeProfit: 0.05,
		 	amount: 1000,
		 	close: 3609.447546831,
		 	fee: 4.1,
		 	profit: 45.9,
		 }],
	};
	expect(result).toEqual(expectedFinalState);
});
test('long stoploss should work fine', () => {
	const backtesting = new Backtest({candles: candlesStopLoss, signals: signalsLong});
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 965.94,
		stopLoss: 0.03,
		takeProfit: 0.05,
		maximumBalance: 1000,
		minimumBalance: 965.94,
		positionEntry: 3698.6,
		positionType: 'none',
		profitTrades: 0,
		unprofitTrades: 1,
		totalTrades: 1,
		trades:
		[{
			type: 'long',
			entry: 3698.6,
			stopLoss: 0.03,
			takeProfit: 0.05,
			amount: 1000,
			close: 3587.642,
			fee: 4.0600000000000005,
			profit: -34.06,
		}],
	};
	expect(result).toEqual(expectedFinalState);
});
test('short takeprofit should work fine', () => {
	const backtesting = new Backtest({candles: candlesShort, signals: signalsShort});
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 1045.9,
		stopLoss: 0.03,
		takeProfit: 0.05,
		maximumBalance: 1045.9,
		minimumBalance: 1000,
		positionEntry: 3698.6,
		positionType: 'none',
		profitTrades: 1,
		unprofitTrades: 0,
		totalTrades: 1,
		trades:
		 [{
		 	type: 'short',
		 	close: 3513.67,
		 	entry: 3698.6,
		 	stopLoss: 0.03,
		 	takeProfit: 0.05,
		 	amount: 1000,
		 	fee: 4.1,
		 	profit: 45.9,
		 }],
	};
	expect(result).toEqual(expectedFinalState);
});
test('short stoploss should work fine', () => {
	const backtesting = new Backtest({candles: candlesShortStopLoss, signals: signalsShort});
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 965.94,
		stopLoss: 0.03,
		takeProfit: 0.05,
		maximumBalance: 1000,
		minimumBalance: 965.94,
		positionEntry: 3437.56909222,
		positionType: 'none',
		profitTrades: 0,
		unprofitTrades: 1,
		totalTrades: 1,
		trades:
		 [{
		 	type: 'short',
		 	entry: 3437.56909222,
		 	stopLoss: 0.03,
		 	takeProfit: 0.05,
		 	amount: 1000,
		 	close: 3540.6961649866003,
		 	fee: 4.0600000000000005,
		 	profit: -34.06,
		 }],
	};
	expect(result).toEqual(expectedFinalState);
});
test('indicators', () => {
	const indicators = [
		{name: 'rsi', period: 14},
		{name: 'ema', period: 50},
		{name: 'ema', period: 200},
	];
	const backtesting = new Backtest({candles: candlesIndicators, indicators});
	backtesting.start();
	const calculatedIndicators = backtesting.getIndicators();
	expect(calculatedIndicators.indicatorNames).toEqual(indicators);
	expect(calculatedIndicators.rsi14).toEqual(expectedRsi14);
	expect(calculatedIndicators.ema50).toEqual(expectedEma50);
	expect(calculatedIndicators.ema200).toEqual(expectedEma200);
});
test('startegy with limit orders', () => {
	const strategy = function strategyWithLimitOrders(
		candleIndex, candle, positionTypes, orderTypes,
	) {
		const price = 3437.56;
		this.placeOrder(price, positionTypes.LONG, orderTypes.LIMIT);
	};
	const backtesting = new Backtest({candles: candlesLongLimitOrder, strategy});
	const result = backtesting.start();
	const expectedBactestResult = {
		balanceUSD: 1045.9,
		stopLoss: 0.03,
		takeProfit: 0.05,
		positionEntry: 3437.56,
		positionType: 'none',
		trades:
       [{
       	type: 'long',
       	entry: 3437.56,
       	stopLoss: 0.03,
       	takeProfit: 0.05,
       	amount: 1000,
       	close: 3609.438,
       	fee: 4.1,
       	profit: 45.9,
       }],
		maximumBalance: 1045.9,
		minimumBalance: 1000,
		totalTrades: 1,
		profitTrades: 1,
		unprofitTrades: 0,
	};
	expect(result).toEqual(expectedBactestResult);
});
