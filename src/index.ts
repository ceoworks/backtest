import * as TechnicalIndicators from 'technicalindicators';
import {
	defaultBalance, defaultExchangeFee,
	defaultIndicatorPeriod, defaultStopLoss,
	defaultTakeProfit, orderTypes,
	positionTypes,
} from '../src/config';
import * as transformCandle from '../src/util/transformCandle';

enum PositionTypesEnum {
	LONG = 'long',
	SHORT = 'short',
	NONE = 'none',
}

enum OrderTypesEnum {
	LIMIT = 'limit',
	MARKET = 'market',
}

interface State {
	balanceUSD: number;
	maximumBalance: number;
	minimumBalance: number;
	positionEntry?: number;
	positionType: PositionTypesEnum;
	stopLoss: number;
	takeProfit: number;
	trades: Trade[];
}

interface Candle {
	candleTimestamp: number;
	close: number;
	high: number;
	low: number;
	open: number;
	volume: number;
}

interface Trade {
	amount: number;
	close: number;
	entry: number;
	fee: number;
	profit: number;
	stopLoss: number;
	takeProfit: number;
	type: PositionTypesEnum;
}

interface Order {
	fillOrKill?: boolean;
	orderType?: OrderTypesEnum;
	positionType: PositionTypesEnum;
	price: number;
}

interface IndicatorSettings {
	name: string;
	period: number;
	rsiPeriod: number;
	stddev: number;
	stochasticPeriod: number;
}

type Strategy = (candleIndex: number, candle: Candle, positionTypes: PositionTypesEnum, orderTypes: OrderTypesEnum) => void;

class Backtest {
	public candles: Candle[];
	public exchangeFee: number;
	public indicators: any;
	public indicatorsSettings: IndicatorSettings[];
	public orders: Order[];
	public signals: object;
	public state: State;
	public strategy: Strategy;

	constructor({
		candles, signals, stopLoss, takeProfit, exchangeFee, balanceUSD, indicators, strategy,
	}) {
		const balance = balanceUSD || defaultBalance;
		this.state = {
			balanceUSD: balance,
			stopLoss: stopLoss || defaultStopLoss,
			takeProfit: takeProfit || defaultTakeProfit,
			positionType: positionTypes.NONE,
			trades: [],
			maximumBalance: balance,
			minimumBalance: balance,
		};
		this.strategy = strategy || (() => {});
		this.candles = candles.map((candle) => transformCandle(candle));
		this.signals = signals || {};
		this.indicators = {};
		this.indicatorsSettings = indicators || [];
		this.exchangeFee = exchangeFee || defaultExchangeFee;
		this.orders = [];
	}

	public addSignal({
		timestamp, price, positionType, orderType,
	}): void {
		this.signals[timestamp] = {
			price, positionType, orderType,
		};
	}

	public calculateIndicators(): void {
		this.indicatorsSettings.forEach((indicator) => {
			const period: number = indicator.period || defaultIndicatorPeriod;
			const indicatorKey = indicator.name + period;
			if (!this.indicators[indicatorKey]) {
				this.indicators[indicatorKey] = this.fillBlankIndicatorValues(period);
			}
			const inputCandles = this.candles.map((candle) => candle.close);
			const indicatorInput: any = {values: inputCandles, period};
			if (indicator.stddev) {
				indicatorInput.stddev = indicator.stddev;
			}
			if (indicator.rsiPeriod && indicator.stochasticPeriod) {
				indicatorInput.rsiPeriod = indicator.rsiPeriod;
				indicatorInput.stochasticPeriod = indicator.stochasticPeriod;
			}
			const calculatedIndicator = TechnicalIndicators[indicator.name](indicatorInput);
			this.indicators[indicatorKey] = this.indicators[indicatorKey].concat(calculatedIndicator);
		});
	}

	public cancelFillOrKillOrders(): void {
		this.orders = this.orders.filter((order) => order.fillOrKill !== true);
	}

	public checkForSignal(candleIndex, candle): void {
		const {candleTimestamp} = candle;
		// console.log('this.signals[candleTimestamp]:', this.signals[candleTimestamp]);
		return this.signals[candleTimestamp];
	}

	public checkStopLossAndTakeProfit(candle): void {
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
			// console.log(`SL: ${isStopLossHit}, TP: ${isTakeProfitHit}, Low: ${candle.low}, High: ${candle.high}`);
			this.closePosition({isStopLossHit, isTakeProfitHit});
		}
	}

	public closePosition({isStopLossHit, isTakeProfitHit}): void {
		const trade: Trade = {
			type: this.state.positionType,
			entry: this.state.positionEntry,
			stopLoss: this.state.stopLoss,
			takeProfit: this.state.takeProfit,
			amount: this.state.balanceUSD < 1000 ? this.state.balanceUSD : 1000,
			close: 0,
			fee: 0,
			profit: 0,
		};
		const isLongPosition = trade.type === PositionTypesEnum.LONG;
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
		// console.log('new trade:', trade, {isStopLossHit, isTakeProfitHit});
		this.state.positionType = positionTypes.NONE;
		this.state.balanceUSD += trade.profit;
		this.state.trades.push(trade);
		this.handleBalanceStats();
		this.logState();
	}

	public countTrades(): void {
		const totalTrades = this.state.trades.length;
		const profitTrades = this.state.trades.filter((t) => t.profit > 0).length;
		const unprofitTrades = totalTrades - profitTrades;
		Object.assign(this.state, {totalTrades, profitTrades, unprofitTrades});
	}

	public fillBlankIndicatorValues(period = defaultIndicatorPeriod): number[] {
		return Array(period).fill(0);
	}

	public getIndicators(): any {
		return this.indicators;
	}

	public handleBalanceStats(): void {
		const {balanceUSD, maximumBalance, minimumBalance} = this.state;
		if (balanceUSD > maximumBalance) {
			this.state.maximumBalance = balanceUSD;
		}
		if (balanceUSD < minimumBalance) {
			this.state.minimumBalance = balanceUSD;
		}
	}

	public logState(): void {
		const logState = JSON.parse(JSON.stringify(this.state));
		logState.trades = logState.trades.length;
		// console.log('new state:', logState);
	}

	public openPosition(price, positionType = positionTypes.LONG): void {
		if (this.state.positionType !== positionTypes.NONE) {
			return;
		}
		// console.log('new position:', price, positionType);
		this.state.positionEntry = price;
		this.state.positionType = positionType;
	}

	public placeOrder(price: number, positionType: PositionTypesEnum, orderType?: OrderTypesEnum, fillOrKill?: boolean): void {
		this.orders.push({
			price, positionType, orderType, fillOrKill,
		});
	}

	public processSignals(candle): void {
		const {candleTimestamp} = candle;
		const signal = this.signals[candleTimestamp];
		if (signal) {
			const {positionType, price, orderType} = signal;
			if (orderType === orderTypes.MARKET) {
				this.openPosition(candle.close, positionType);
			} else if (orderType === orderTypes.LIMIT) {
				this.placeOrder(price, positionType);
			}
		}
	}

	public start(): State {
		this.calculateIndicators();
		this.candles.forEach((candle: Candle, candleIndex: number) => {
			// console.log(`Candle #${candleIndex + 1} (${candle.candleTimestamp}) of ${this.candles.length}`);
			if (this.state.positionType !== PositionTypesEnum.NONE) {
				this.checkStopLossAndTakeProfit(candle);
			}
			this.tryToFillOrders(candle);
			this.cancelFillOrKillOrders();
			this.strategy(candleIndex, candle, positionTypes, orderTypes);
			this.processSignals(candle);
		});
		this.countTrades();
		return this.state;
	}

	public tryToFillOrders(candle): void {
		this.orders = this.orders.reduce((unexecutedOrders, order) => {
			if (order.price >= candle.low && order.price <= candle.high) {
				this.openPosition(order.price, order.positionType);
			}
			return unexecutedOrders;
		}, []);
	}
}

module.exports = Backtest;
