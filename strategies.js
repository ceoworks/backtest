module.exports.ema200Strategy = function (candleIndex, candle, positionTypes, orderTypes) {
	const {close, candleTimestamp} = candle;
	const {ema50 = [], ema200 = []} = this.indicators;
	const lastEma50Value = ema50[candleIndex];
	const lastEma200Value = ema200[candleIndex];
	const positionType = lastEma50Value > lastEma200Value
		? positionTypes.LONG : positionTypes.SHORT;
	if (lastEma200Value) {
		const price = lastEma200Value;
		const fillOrKill = true;
		this.placeOrder(
			price,
			positionType,
			orderTypes.LIMIT,
			fillOrKill,
		);
	}
};
