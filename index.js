const candles = require('./bitcoin_1H_candles_data.json');
let buyDivergences = require('./signals.json');

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
	if (isStopLossHit) {
		trade.close = trade.entry - (trade.entry * trade.stopLoss);
	} else if (isTakeProfitHit) {
		trade.close = trade.entry + (trade.entry * trade.takeProfit);
	}
	trade.fee = (trade.entry + trade.close) * defaultExchangeFee;
	trade.profit = trade.amount * ((trade.close - trade.entry) / trade.entry) - trade.fee;
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

class Backtest {
	constructor(candles, signals) {
		this.state = {
			balanceUSD: 1000,
			stopLoss: defaultStopLoss,
			takeProfit: defaultTakeProfit,
			positionEntry: undefined,
			positionType: positionTypes.NONE,
			trades: [],
		};
		this.candles = candles;
		this.signals = signals;
	}
	start() {
		this.candles.forEach((candle, index) => {
			console.log(`Candle #${index + 1} of ${this.candles.length}`);
			candle = this.transformCandle(candle);
			if (this.state.positionType !== positionTypes.NONE) {
				const {isStopLossHit, isTakeProfitHit} = this.checkStopLossAndTakeProfit(candle);
				if (isStopLossHit || isTakeProfitHit) {
					this.closePosition({isStopLossHit, isTakeProfitHit});
				}
			}
			if (this.state.positionType === positionTypes.NONE) {
				const divergence = this.checkForSignal(candle.candleTimestamp);
				if (divergence) {
					this.openPosition(candle);
				}
			}
		});
		console.dir(this.state, {depth: null, colors: true, maxArrayLength: null});
		return this.state;
	}
	transformCandle(candle) {
		const [candleTimestamp, open, close, high, low, volume] = candle;
		return {
			candleTimestamp, open, close, high, low, volume,
		};
	}
	checkStopLossAndTakeProfit(candle) {
		let isStopLossHit = false;
		let isTakeProfitHit = false;
		if (this.state.positionEntry > candle.low) {
			const difference = this.state.positionEntry - candle.low;
			const drawdownPercentage = difference / this.state.positionEntry;
			if (drawdownPercentage >= this.state.stopLoss) {
				isStopLossHit = true;
			}
		}
		if (this.state.positionEntry < candle.high) {
			const difference = candle.high - this.state.positionEntry;
			const profitPercentage = difference / this.state.positionEntry;
			if (profitPercentage >= this.state.takeProfit) {
				isTakeProfitHit = true;
			}
		}
		if (isStopLossHit || isTakeProfitHit) {
			console.log(`SL: ${isStopLossHit}, TP: ${isTakeProfitHit}, Low: ${candle.low}, High: ${candle.high}`);
		}
		return {isStopLossHit, isTakeProfitHit};
	}
	closePosition({isStopLossHit, isTakeProfitHit}) {
		const trade = {
			type: this.state.positionType,
			entry: this.state.positionEntry,
			stopLoss: this.state.stopLoss,
			takeProfit: this.state.takeProfit,
			amount: this.state.balanceUSD,
		};
		if (isStopLossHit) {
			trade.close = trade.entry - (trade.entry * trade.stopLoss);
		} else if (isTakeProfitHit) {
			trade.close = trade.entry + (trade.entry * trade.takeProfit);
		}
		trade.fee = (trade.amount + (Math.abs(trade.close - trade.entry) / trade.entry * trade.amount + trade.amount)) * defaultExchangeFee;
		trade.profit = trade.amount * ((trade.close - trade.entry) / trade.entry) - trade.fee;
		console.log('new trade:', trade, {isStopLossHit, isTakeProfitHit});
		this.state.positionType = positionTypes.NONE;
		this.state.balanceUSD += trade.profit;
		this.state.trades.push(trade);
		this.logState();
	}
	logState() {
		const logState = JSON.parse(JSON.stringify(state));
		logState.trades = logState.trades.length;
		console.log('new state:', logState);
	}
	checkForSignal(candleTimestamp) {
		return this.signals[candleTimestamp];
	}
	openPosition(candle) {
		console.log('new position:', candle);
		this.state.positionEntry = candle.low;
		this.state.positionType = positionTypes.LONG;
	}
}

module.exports = Backtest;
