'use strict';
module.exports = function (obj, fn, target) {
	target = target || {};
	var keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var res = fn(key, obj[key], obj);
		target[res[0]] = res[1];
	}

	return target;
};
