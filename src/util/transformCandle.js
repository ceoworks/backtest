module.exports = function transformCandle(candle) {
	const [candleTimestamp, open, close, high, low, volume] = candle;
	return {
		candleTimestamp, open, close, high, low, volume,
	};
};
