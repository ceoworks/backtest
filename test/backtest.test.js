const Backtest = require('../lib');
const candles = require('./mocks/testCandles.json');
const candlesStopLoss = require('./mocks/testCandlesStopLoss.json');
const signals = require('./mocks/getSignals');


// one test for take profit

// one test for stop loss

// check fee to be counted correctly

test('takeprofit should work fine', () => {
	const backtesting = new Backtest(candles, signals);
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 1045.9,
    stopLoss: 0.03,
    takeProfit: 0.05,
    positionEntry: 3436.2,
    positionType: 'none',
    trades:
     [ { type: 'long',
         entry: 3436.2,
         stopLoss: 0.03,
         takeProfit: 0.05,
         amount: 1000,
         close: 3608.0099999999998,
         fee: 4.1,
         profit: 45.899999999999984 } ]
	};
  expect(result).toEqual(expectedFinalState);
});
test('stoploss should work fine', () => {
	const backtesting = new Backtest(candlesStopLoss, signals);
	const result = backtesting.start();
	const expectedFinalState = 	{
		balanceUSD: 965.9399999999999,
	  stopLoss: 0.03,
	  takeProfit: 0.05,
	  positionEntry: 3691,
	  positionType: 'none',
	  trades:
	   [ { type: 'long',
	       entry: 3691,
	       stopLoss: 0.03,
	       takeProfit: 0.05,
	       amount: 1000,
	       close: 3580.27,
	       fee: 4.0600000000000005,
	       profit: -34.06000000000001 } ]
	};
  expect(result).toEqual(expectedFinalState);
});
