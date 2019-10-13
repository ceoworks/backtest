const signals = require('./signals.json');
const {orderTypes} = require('../../src/config');

module.exports = function getSignals(positionType = 'long', orderType = orderTypes.MARKET) {
	const signalsMap = {};
	signals.forEach((s) => {
		signalsMap[s.date] = {
			...s, positionType, orderType, price: s.close,
		};
	});
	return signalsMap;
};
