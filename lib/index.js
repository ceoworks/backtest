const TechnicalIndicators = require('technicalindicators');
const {
	defaultStopLoss, defaultTakeProfit,
	positionTypes, defaultExchangeFee,
	defaultBalance, defaultIndicatorPeriod,
} = require('./config');

class Backtest {
	constructor({
		candles, signals, stopLoss, takeProfit, exchangeFee, balanceUSD, indicators,
	}) {
		const balance = balanceUSD || defaultBalance;
		this.state = {
			balanceUSD: balance,
			stopLoss: stopLoss || defaultStopLoss,
			takeProfit: takeProfit || defaultTakeProfit,
			positionEntry: undefined,
			positionType: positionTypes.NONE,
			trades: [],
			maximumBalance: balance,
			minimumBalance: balance,
		};
		this.candles = candles.map(candle => this.transformCandle(candle));
		this.signals = signals || {};
		this.indicators = {
			indicatorNames: indicators || [],
		};
		this.exchangeFee = exchangeFee || defaultExchangeFee;
	}

	start() {
		this.calculateIndicators();
		this.candles.forEach((candle, candleIndex) => {
			console.log(`Candle #${candleIndex + 1} of ${this.candles.length}`);
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
			amount: this.state.balanceUSD < 1000 ? this.state.balanceUSD : 1000,
		};
		const isLongPosition = trade.type === positionTypes.LONG;
		let difference;
		if (isStopLossHit) {
			difference = -(trade.entry * trade.stopLoss);
		} else if (isTakeProfitHit) {
			difference = (trade.entry * trade.takeProfit);
		}
		trade.close = isLongPosition ? trade.entry + difference : trade.entry - difference;

		trade.fee = this.exchangeFee * (2 * trade.amount
			+ (Math.abs(trade.close - trade.entry) / trade.entry * trade.amount));
		trade.profit = trade.amount * (difference / trade.entry) - trade.fee;
		console.log('new trade:', trade, {isStopLossHit, isTakeProfitHit});
		this.state.positionType = positionTypes.NONE;
		this.state.balanceUSD += trade.profit;
		this.state.trades.push(trade);
		this.handleBalanceStats();
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
		this.state.positionEntry = candle.close;
		this.state.positionType = positionType;
	}

	countTrades() {
		const totalTrades = this.state.trades.length;
		const profitTrades = this.state.trades.filter(t => t.profit > 0).length;
		const unprofitTrades = totalTrades - profitTrades;
		Object.assign(this.state, {totalTrades, profitTrades, unprofitTrades});
	}

	calculateIndicators() {
		const {indicatorNames} = this.indicators;
		indicatorNames.forEach((indicator) => {
			const period = indicator.period || defaultIndicatorPeriod;
			const indicatorKey = indicator.name + period;
			if (!this.indicators[indicatorKey]) {
				this.indicators[indicatorKey] = this.fillBlankIndicatorValues(period);
			}
			const inputCandles = this.candles.map(candle => candle.close);
			const indicatorInput = {values: inputCandles, period};
			const calculatedIndicator = TechnicalIndicators[indicator.name](indicatorInput);
			this.indicators[indicatorKey] = this.indicators[indicatorKey].concat(calculatedIndicator);
		});
	}

	fillBlankIndicatorValues(period = defaultIndicatorPeriod) {
		return Array(period).fill(0);
	}

	getIndicators() {
		return this.indicators;
	}

	handleBalanceStats() {
		const {balanceUSD, maximumBalance, minimumBalance} = this.state;
		if (balanceUSD > maximumBalance) {
			this.state.maximumBalance = balanceUSD;
		}
		if (balanceUSD < minimumBalance) {
			this.state.minimumBalance = balanceUSD;
		}
	}
}

module.exports = Backtest;
