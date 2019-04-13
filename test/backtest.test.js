const config = require('../lib/config');
const Backtest = require('../lib');
const candles = require('./mocks/testCandlesLongTakeProfit.json');
const candlesStopLoss = require('./mocks/testCandlesLongStopLoss.json');
const candlesShort = require('./mocks/testCandlesShortTakeProfit.json');
const candlesShortStopLoss = require('./mocks/testCandlesShortStopLoss.json');
const signalsLong = require('./mocks/getSignals')();
const signalsShort = require('./mocks/getSignals')(config.positionTypes.SHORT);

test('long takeprofit should work fine', () => {
	const backtesting = new Backtest({candles, signals: signalsLong});
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 1045.9,
    stopLoss: 0.03,
    takeProfit: 0.05,
    positionEntry: 3436.2,
    positionType: 'none',
		profitTrades: 1,
		unprofitTrades: 0,
		totalTrades: 1,
    trades:
     [ { type: 'long',
         entry: 3436.2,
         stopLoss: 0.03,
         takeProfit: 0.05,
         amount: 1000,
         close: 3608.0099999999998,
         fee: 4.1,
         profit: 45.9 } ]
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
	  positionEntry: 3691,
	  positionType: 'none',
		profitTrades: 0,
		unprofitTrades: 1,
		totalTrades: 1,
	  trades:
	   [ { type: 'long',
	       entry: 3691,
	       stopLoss: 0.03,
	       takeProfit: 0.05,
	       amount: 1000,
	       close: 3580.27,
	       fee: 4.0600000000000005,
	       profit: -34.06 } ]
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
    positionEntry: 3820.3,
    positionType: 'none',
		profitTrades: 1,
		unprofitTrades: 0,
		totalTrades: 1,
    trades:
     [ { type: 'short',
         entry: 3820.3,
         stopLoss: 0.03,
         takeProfit: 0.05,
         amount: 1000,
         close: 3629.2850000000003,
         fee: 4.1,
         profit: 45.9 } ]
	};
  expect(result).toEqual(expectedFinalState);
});
test('short takeprofit should work fine', () => {
	const backtesting = new Backtest({candles: candlesShortStopLoss, signals: signalsShort});
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 965.94,
    stopLoss: 0.03,
    takeProfit: 0.05,
    positionEntry: 3438.5,
    positionType: 'none',
		profitTrades: 0,
		unprofitTrades: 1,
		totalTrades: 1,
    trades:
     [ { type: 'short',
         entry: 3438.5,
         stopLoss: 0.03,
         takeProfit: 0.05,
         amount: 1000,
         close: 3541.655,
         fee: 4.0600000000000005,
         profit: -34.06 } ]
	};
  expect(result).toEqual(expectedFinalState);
});
