const signals = require('./signals.json');

module.exports = function getSignals(positionType = 'long') {
	const signalsMap = {};
	signals.forEach((s) => {
		signalsMap[s.date] = {...s, positionType};
	});
	return signalsMap;
};
