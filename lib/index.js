const {defaultStopLoss, defaultTakeProfit, positionTypes, defaultExchangeFee, defaultBalance} = require('./config');

class Backtest {
	constructor({candles, signals, stopLoss, takeProfit, exchangeFee, balanceUSD}) {
		this.state = {
			balanceUSD: balanceUSD || defaultBalance,
			stopLoss: stopLoss || defaultStopLoss,
			takeProfit: takeProfit || defaultTakeProfit,
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
				const signal = this.checkForSignal(candle.candleTimestamp);
				if (signal) {
					this.openPosition(candle, signal.positionType);
				}
			}
		});
		this.countTrades();
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
		if (this.state.positionType === positionTypes.LONG) {
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
		}
		if (this.state.positionType === positionTypes.SHORT) {
			if (this.state.positionEntry < candle.high) {
				const difference = candle.high - this.state.positionEntry;
				const profitPercentage = difference / this.state.positionEntry;
				if (profitPercentage >= this.state.stopLoss) {
					isStopLossHit = true;
				}
			}
			if (this.state.positionEntry > candle.low) {
				const difference = this.state.positionEntry - candle.low;
				const drawdownPercentage = difference / this.state.positionEntry;
				if (drawdownPercentage >= this.state.takeProfit) {
					isTakeProfitHit = true;
				}
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
		const isLongPosition = trade.type === positionTypes.LONG;
		let difference;
		if (isStopLossHit) {
			difference = - (trade.entry * trade.stopLoss)
		} else if (isTakeProfitHit) {
			difference = (trade.entry * trade.takeProfit)
		}
		trade.close = isLongPosition ? trade.entry + difference : trade.entry - difference;

		trade.fee = (2 * trade.amount + (Math.abs(trade.close - trade.entry) / trade.entry * trade.amount)) * defaultExchangeFee;
		trade.profit = trade.amount * (difference / trade.entry) - trade.fee;
		console.log('new trade:', trade, {isStopLossHit, isTakeProfitHit});
		this.state.positionType = positionTypes.NONE;
		this.state.balanceUSD += trade.profit;
		this.state.trades.push(trade);
		this.logState();
	}
	logState() {
		const logState = JSON.parse(JSON.stringify(this.state));
		logState.trades = logState.trades.length;
		console.log('new state:', logState);
	}
	checkForSignal(candleTimestamp) {
		return this.signals[candleTimestamp];
	}
	openPosition(candle, positionType = positionTypes.LONG) {
		console.log('new position:', candle, positionType);
		this.state.positionEntry = positionType === positionTypes.LONG ? candle.low : candle.high;
		this.state.positionType = positionType;
	}
	countTrades() {
		const totalTrades = this.state.trades.length;
		const profitTrades = this.state.trades.filter(t => t.profit > 0).length;
		const unprofitTrades = totalTrades - profitTrades;
		Object.assign(this.state, {totalTrades, profitTrades, unprofitTrades});
		
	}
}

module.exports = Backtest;
