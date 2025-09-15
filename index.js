const isObject = value => typeof value === 'object' && value !== null;

// Customized for this use-case
const isObjectCustom = value =>
	isObject(value)
	&& !(value instanceof RegExp)
	&& !(value instanceof Error)
	&& !(value instanceof Date)
	&& !(globalThis.Blob && value instanceof globalThis.Blob)
	&& typeof value.$$typeof !== 'symbol' // Jest asymmetric matchers
	&& typeof value.asymmetricMatch !== 'function'; // Jest matchers

export const mapObjectSkip = Symbol('mapObjectSkip');

const _mapObject = (object, mapper, options, isSeen = new WeakMap()) => {
	const {
		target = {},
		...processOptions
	} = {
		deep: false,
		...options,
	};

	if (isSeen.has(object)) {
		return isSeen.get(object);
	}

	isSeen.set(object, target);

	const mapArray = array => array.map(element => isObjectCustom(element) ? _mapObject(element, mapper, processOptions, isSeen) : element);
	if (Array.isArray(object)) {
		return mapArray(object);
	}

	for (const [key, value] of Object.entries(object)) {
		const mapResult = mapper(key, value);

		if (mapResult === mapObjectSkip) {
			continue;
		}

		let [newKey, newValue, {shouldRecurse = true} = {}] = mapResult;

		// Drop `__proto__` keys.
		if (newKey === '__proto__') {
			continue;
		}

		if (processOptions.deep && shouldRecurse && isObjectCustom(newValue)) {
			newValue = Array.isArray(newValue)
				? mapArray(newValue)
				: _mapObject(newValue, mapper, processOptions, isSeen);
		}

		target[newKey] = newValue;
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
