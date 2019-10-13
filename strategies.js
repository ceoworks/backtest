module.exports.ema200Strategy = function (candleIndex, candle, positionTypes, orderTypes) {
	// const {close, candleTimestamp} = candle;
	// const {ema9 = [], ema21 = [], rsi14 = []} = this.indicators;
	// const lastEma50Value = ema9[candleIndex];
	// const lastEma200Value = ema21[candleIndex];
	// const lastRsi14Value = rsi14[candleIndex];
	// const positionType = lastEma50Value > lastEma200Value
	// 	? positionTypes.LONG : positionTypes.SHORT;
	// if (lastEma50Value) {
	// 	const price = lastEma50Value;
	// 	const fillOrKill = true;
	// 	this.placeOrder(
	// 		price,
	// 		positionType,
	// 		orderTypes.LIMIT,
	// 		fillOrKill,
	// 	);
	// }
	const {
		ema9 = [], ema21 = [], rsi14 = [],
		stochasticrsi14 = [], adx14 = [],
		bollingerbands14 = [],
	} = this.indicators;

	const {close, candleTimestamp} = candle;
	const fillOrKill = true;
	this.placeOrder(
		close * 0.95,
		positionTypes.LONG,
		orderTypes.LIMIT,
		fillOrKill,
	);
};
