'use strict';

const isObject = value => typeof value === 'object' && value !== null;
const mapObjectSkip = Symbol('skip');

// Customized for this use-case
const isObjectCustom = value =>
	isObject(value) &&
	!(value instanceof RegExp) &&
	!(value instanceof Error) &&
	!(value instanceof Date);

const mapObject = (object, mapper, options, isSeen = new WeakMap(), path = []) => {
	options = {
		deep: false,
		target: {},
		...options
	};

	if (isSeen.has(object)) {
		return isSeen.get(object);
	}

	isSeen.set(object, options.target);

	const {target} = options;
	delete options.target;

	const mapArray = array => array.map(element => isObjectCustom(element) ? mapObject(element, mapper, options, isSeen, path) : element);
	if (Array.isArray(object)) {
		return mapArray(object);
	}

	for (const [key, value] of Object.entries(object)) {
		path.push(key);
		const mapResult = mapper(key, value, object);

		if (mapResult === mapObjectSkip) {
			path.pop();
			continue;
		}

		let [newKey, newValue, {shouldRecurse = true} = {}] = mapResult;

		// Drop `__proto__` keys.
		if (newKey === '__proto__') {
			path.pop();
			continue;
		}

		if (options.deep && shouldRecurse && isObjectCustom(newValue)) {
			newValue = Array.isArray(newValue) ?
				mapArray(newValue) :
				mapObject(newValue, mapper, options, isSeen, path);
		}

		target[newKey] = newValue;
		path.pop();
	}

	return target;
};

module.exports = (object, mapper, options) => {
	if (!isObject(object)) {
		throw new TypeError(`Expected an object, got \`${object}\` (${typeof object})`);
	}

	return mapObject(object, mapper, options);
};

module.exports.mapObjectSkip = mapObjectSkip;
