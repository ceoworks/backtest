const _ = require('lodash');
const candles = require('./bitcoin_1H_candles_data.json');
let buyDivergences = require('./buyDivergences.json');

buyDivergences = Object.values(buyDivergences[0]);
const defaultExchangeFee = 0.002; // 0.2% for Bitfinex
const defaultStopLoss = 0.03;
const defaultTakeProfit = 0.05;

const positionTypes = {
	LONG: 'long',
	SHORT: 'short',
	NONE: 'none',
};
const state = {
	balanceUSD: 1000,
	stopLoss: defaultStopLoss,
	takeProfit: defaultTakeProfit,
	positionEntry: undefined,
	positionType: positionTypes.NONE,
	trades: [],
};

startBacktesting();

function startBacktesting() {
	candles.forEach((candle, index) => {
		console.log(`Candle #${index + 1} of ${candles.length}`);
		candle = transformCandle(candle);
		if (state.positionType !== positionTypes.NONE) {
			const {isStopLossHit, isTakeProfitHit} = checkStopLoss(candle);
			if (isStopLossHit || isTakeProfitHit) {
				closePosition({isStopLossHit, isTakeProfitHit});
			}
		}
		if (state.positionType === positionTypes.NONE) {
			const divergence = checkForDivergence(candle.candleTimestamp);
			if (divergence) {
				openLongPosition(candle);
			}
		}
	});
	console.dir(state, {depth: null, colors: true, maxArrayLength: null})
}
function checkForDivergence(candleTimestamp) {
	return _.find(buyDivergences, function(d) { return d.date === candleTimestamp; });
}
function openLongPosition(candle) {
	console.log('new position:', candle);
	state.positionEntry = candle.low;
	state.positionType = positionTypes.LONG;
}
function checkStopLoss(candle) {
	let isStopLossHit = false;
	let isTakeProfitHit = false;
	if (state.positionEntry > candle.low) {
		const difference = state.positionEntry - candle.low;
		const drawdownPercentage = difference / state.positionEntry;
		if (drawdownPercentage >= state.stopLoss) {
			isStopLossHit = true;
		}
	}
	if (state.positionEntry < candle.high) {
		const difference = candle.high - state.positionEntry;
		const profitPercentage = difference / state.positionEntry;
		if (profitPercentage >= state.takeProfit) {
			isTakeProfitHit = true;
		}
	}
	if (isStopLossHit || isTakeProfitHit) {
		console.log(`SL: ${isStopLossHit}, TP: ${isTakeProfitHit}, Low: ${candle.low}, High: ${candle.high}`);
	}
	return {isStopLossHit, isTakeProfitHit};
}
function transformCandle(candle) {
	const [candleTimestamp, open, close, high, low, volume] = candle;
	return {
		candleTimestamp, open, close, high, low, volume,
	};
}
function closePosition({isStopLossHit, isTakeProfitHit}) {
	const trade = {
		type: state.positionType,
		entry: state.positionEntry,
		stopLoss: state.stopLoss,
		takeProfit: state.takeProfit,
		amount: state.balanceUSD,
	};
	trade.fee = trade.amount * defaultExchangeFee;
	if (isStopLossHit) {
		trade.close = trade.entry - (trade.entry * trade.stopLoss);
	} else if (isTakeProfitHit) {
		trade.close = trade.entry + (trade.entry * trade.takeProfit);
	}
	trade.profit = trade.close - trade.entry - trade.fee;
	console.log('new trade:', trade, {isStopLossHit, isTakeProfitHit});
	state.positionType = positionTypes.NONE;
	state.balanceUSD += trade.profit;
	state.trades.push(trade);
	logState();
}
function logState() {
	const logState = JSON.parse(JSON.stringify(state));
	logState.trades = logState.trades.length;
	console.log('new state:', logState);
}
