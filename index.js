'use strict';

var isObject = function (x) {
	return typeof x === 'object' && x !== null;
};

module.exports = function mapObj(obj, fn, opts) {
	opts = opts || {};

	var target = opts.target || {};
	delete opts.target;
	var keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var val = obj[key];
		var res = fn(key, val, obj);
		var newVal = res[1];

		if (opts.deep && isObject(newVal)) {
			if (Array.isArray(newVal)) {
				newVal = newVal.map(function (x) {
					return isObject(x) ? mapObj(x, fn, opts) : x;
				});
			} else {
				newVal = mapObj(newVal, fn, opts);
			}
		}

		target[res[0]] = newVal;
	}

	return target;
};
