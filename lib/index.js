const {defaultStopLoss, defaultTakeProfit, positionTypes, defaultExchangeFee} = require('./config');

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
		const logState = JSON.parse(JSON.stringify(this.state));
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
	countTrades() {
		const totalTrades = this.state.trades.length;
		const profitTrades = this.state.trades.filter(t => t.profit > 0).length;
		const unprofitTrades = totalTrades - profitTrades;
		Object.assign(this.state, {totalTrades, profitTrades, unprofitTrades});
	}
}

module.exports = Backtest;
