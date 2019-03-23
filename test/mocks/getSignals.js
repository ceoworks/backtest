const signals = require('./signals.json');
const signalsMap = {};

signals.forEach((d) => {
	signalsMap[d.date] = d;
});
module.exports = signalsMap;
