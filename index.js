const isObject = value => typeof value === 'object' && value !== null;

// Check if a value is a plain object that should be recursed into
/* eslint-disable unicorn/prefer-combined-guards -- the exclusions are kept in separate blocks so each keeps its own comment */
const isObjectCustom = value => {
	if (!isObject(value)) {
		return false;
	}

	// Exclude built-in objects
	if (
		value instanceof RegExp
		|| value instanceof Error
		|| value instanceof Date
		|| value instanceof Map
		|| value instanceof Set
		|| value instanceof WeakMap
		|| value instanceof WeakSet
		|| value instanceof Promise
		|| value instanceof ArrayBuffer
		|| value instanceof DataView
		|| ArrayBuffer.isView(value) // Typed arrays
		|| value instanceof Blob
	) {
		return false;
	}

	// Exclude Jest matchers
	if (typeof value.$$typeof === 'symbol' || typeof value.asymmetricMatch === 'function') {
		return false;
	}

	return true;
};
/* eslint-enable unicorn/prefer-combined-guards */

export const mapObjectSkip = Symbol('mapObjectSkip');

const getEnumerableKeys = (object, includeSymbols) => {
	if (includeSymbols) {
		const stringKeys = Object.keys(object);
		const symbolKeys = Object.getOwnPropertySymbols(object).filter(symbol => Object.getOwnPropertyDescriptor(object, symbol)?.enumerable);
		return [...stringKeys, ...symbolKeys];
	}

	return Object.keys(object);
};

const _mapObject = (object, mapper, options, seen = new WeakMap()) => {
	const {
		target = {},
		...processOptions
	} = {
		deep: false,
		includeSymbols: false,
		...options,
	};

	// An array is registered with the array it becomes, so a cycle or a shared array points back at the
	// mapped array instead of at the object target below, which would replace the array with a plain object.
	const mapArray = array => {
		if (seen.has(array)) {
			return seen.get(array);
		}

		const result = [];
		seen.set(array, result);

		for (const element of array) {
			result.push(isObjectCustom(element) ? _mapObject(element, mapper, processOptions, seen) : element);
		}

		return result;
	};

	if (Array.isArray(object)) {
		return mapArray(object);
	}

	if (seen.has(object)) {
		return seen.get(object);
	}

	seen.set(object, target);

	for (const key of getEnumerableKeys(object, processOptions.includeSymbols)) {
		const value = object[key];
		const mapResult = mapper(key, value);

		if (mapResult === mapObjectSkip) {
			continue;
		}

		if (!Array.isArray(mapResult)) {
			throw new TypeError(`Mapper must return an array or mapObjectSkip, got ${mapResult === null ? 'null' : typeof mapResult}`);
		}

		if (mapResult.length < 2) {
			throw new TypeError(`Mapper must return an array with at least 2 elements [key, value], got ${mapResult.length} elements`);
		}

		let [newKey, newValue, {shouldRecurse = true} = {}] = mapResult;

		// Drop `__proto__` keys.
		if (newKey === '__proto__') {
			continue;
		}

		if (shouldRecurse && processOptions.deep && isObjectCustom(newValue)) {
			newValue = Array.isArray(newValue)
				? mapArray(newValue)
				: _mapObject(newValue, mapper, processOptions, seen);
		}

		try {
			target[newKey] = newValue;
		} catch (error) {
			// The name test is read first on purpose. Anything can be thrown, including a
			// primitive with no `.message`, so this order keeps the read below from
			// throwing a second error instead of skipping the property.
			if (error.name === 'TypeError' && error.message.includes('read only')) {
				// Skip non-configurable properties
				continue;
			}

			throw error;
		}
	}

	return target;
};

export default function mapObject(object, mapper, options) {
	if (!isObject(object)) {
		throw new TypeError(`Expected an object, got \`${object}\` (${typeof object})`);
	}

	if (Array.isArray(object)) {
		throw new TypeError('Expected an object, got an array');
	}

	// Ensure the third mapper argument is always the original input object
	const mapperWithRoot = (key, value) => mapper(key, value, object);

	return _mapObject(object, mapperWithRoot, options);
}
