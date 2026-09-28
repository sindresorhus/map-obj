import {test} from 'node:test';
import assert from 'node:assert/strict';
import mapObject, {mapObjectSkip} from './index.js';

test('main', () => {
	assert.equal(mapObject({foo: 'bar'}, key => [key, 'unicorn']).foo, 'unicorn');
	assert.equal(mapObject({foo: 'bar'}, (key, value) => ['unicorn', value]).unicorn, 'bar');
	assert.equal(mapObject({foo: 'bar'}, (key, value) => [value, key]).bar, 'foo');
});

test('mapper source argument is always the original input', () => {
	const input = {foo: {bar: 1}, a: {b: {c: 1}}};

	// Test shallow mode
	mapObject(input, (key, value, source) => {
		assert.equal(source, input);
		return [key, value];
	});

	// Test deep mode
	mapObject(input, (key, value, source) => {
		assert.equal(source, input); // Should always be the root input object, not nested objects
		return [key, value];
	}, {deep: true});
});

test('target option', () => {
	const input = {x: 1, foo: 'bar'};
	const target = {y: 2};

	// Test that the function returns the target object and source argument is correct
	const result = mapObject(input, (key, value, source) => {
		assert.equal(source, input);
		assert.notStrictEqual(source, target);
		return [key === 'foo' ? 'baz' : key, value];
	}, {target});

	assert.equal(result, target);
	assert.deepEqual(target, {y: 2, x: 1, baz: 'bar'});
});

test('deep option', () => {
	const object = {
		one: 1,
		object: {
			two: 2,
			three: 3,
		},
		array: [
			{
				four: 4,
			},
			5,
		],
	};

	const expected = {
		one: 2,
		object: {
			two: 4,
			three: 6,
		},
		array: [
			{
				four: 8,
			},
			5,
		],
	};

	const mapper = (key, value) => [key, typeof value === 'number' ? value * 2 : value];
	const actual = mapObject(object, mapper, {deep: true});
	assert.deepEqual(actual, expected);
});

test('shouldRecurse mapper option', () => {
	const object = {
		one: 1,
		object: {
			two: 2,
			three: 3,
		},
		array: [
			{
				four: 4,
			},
			5,
		],
	};

	const expected = {
		one: 2,
		object: {
			two: 2,
			three: 3,
		},
		array: [
			{
				four: 8,
			},
			5,
		],
	};

	const mapper = (key, value) => key === 'object'
		? [key, value, {shouldRecurse: false}]
		: [key, typeof value === 'number' ? value * 2 : value];

	const actual = mapObject(object, mapper, {deep: true});
	assert.deepEqual(actual, expected);
});

test('nested arrays', () => {
	const object = {
		array: [
			[
				0,
				1,
				2,
				{
					a: 3,
				},
			],
		],
	};

	const expected = {
		array: [
			[
				0,
				1,
				2,
				{
					a: 6,
				},
			],
		],
	};

	const mapper = (key, value) => [key, typeof value === 'number' ? value * 2 : value];
	const actual = mapObject(object, mapper, {deep: true});
	assert.deepEqual(actual, expected);
});

test('handles circular references', () => {
	const object = {
		one: 1,
		array: [
			2,
		],
	};
	object.circular = object;
	object.array2 = object.array;
	object.array.push(object);

	const mapper = (key, value) => [key.toUpperCase(), value];
	const actual = mapObject(object, mapper, {deep: true});

	const expected = {
		ONE: 1,
		ARRAY: [
			2,
		],
	};
	expected.CIRCULAR = expected;
	expected.ARRAY2 = expected.ARRAY;
	expected.ARRAY.push(expected);

	assert.deepEqual(actual, expected);
});

test('the same array is mapped to the same array', () => {
	const array = [2];
	const object = {array, array2: array};

	const actual = mapObject(object, (key, value) => [key, value], {deep: true});

	assert.equal(actual.array, actual.array2);
});

test('handles circular references in arrays', () => {
	const array = [2];
	array.push(array);

	const actual = mapObject({array}, (key, value) => [key, value], {deep: true});

	assert.equal(actual.array[1], actual.array);
});

test('validates input', () => {
	assert.throws(() => {
		mapObject(1, () => {});
	}, {
		name: 'TypeError',
		message: 'Expected an object, got `1` (number)',
	});

	assert.throws(() => {
		mapObject('unicorn', () => {});
	}, {
		name: 'TypeError',
		message: 'Expected an object, got `unicorn` (string)',
	});

	assert.throws(() => {
		mapObject([1, 2], (key, value) => [value, key]);
	}, {
		name: 'TypeError',
		message: 'Expected an object, got an array',
	});
});

test('__proto__ keys are safely dropped', () => {
	const input = {['__proto__']: {one: 1}};
	const output = mapObject(input, (key, value) => [key, value]);
	assert.deepEqual(output, {});

	// `assert.deepEqual` is not quite strict enough to catch the difference between a
	// plain object as a prototype and `Object.prototype`, so the prototype is also
	// checked by identity.
	assert.equal(Object.getPrototypeOf(output), Object.prototype);
});

test('remove keys (#36)', () => {
	const object = {
		one: 1,
		two: 2,
	};

	const expected = {
		one: 1,
	};

	const mapper = (key, value) => value === 1 ? [key, value] : mapObjectSkip;
	const actual = mapObject(object, mapper, {deep: true});
	assert.deepEqual(actual, expected);
});

test('should not recurse into Jest-like matchers', () => {
	// Mock a Jest asymmetric matcher like expect.anything()
	const jestMatcher = {
		$$typeof: Symbol.for('jest.asymmetricMatcher'),
		asymmetricMatch: () => true,
		toString: () => 'expect.anything()',
	};

	const input = {
		normal: {nested: 'value'},
		matcher: jestMatcher,
	};

	let calls = 0;
	const result = mapObject(input, (key, value) => {
		calls++;
		// Should not recurse into jestMatcher properties
		assert.notEqual(key, '$$typeof');
		assert.notEqual(key, 'asymmetricMatch');
		assert.notEqual(key, 'toString');
		return [key, value];
	}, {deep: true});

	assert.equal(result.matcher, jestMatcher);
	assert.equal(result.normal.nested, 'value');
	assert.equal(calls, 3); // 'normal', 'nested', 'matcher'
});

test('options object is not mutated', () => {
	const options = {deep: true, target: {}};
	const originalOptions = {...options};

	mapObject({a: 1}, (key, value) => [key, value], options);

	assert.deepEqual(options, originalOptions);
});

test('built-in objects are not recursed into', () => {
	const date = new Date();
	const regex = /test/v;
	const error = new Error('test');
	const map = new Map([['key', 'value']]);
	const set = new Set([1, 2, 3]);
	const promise = Promise.resolve(42);
	const buffer = new ArrayBuffer(8);
	const uint8Array = new Uint8Array(4);

	const input = {
		date,
		regex,
		error,
		map,
		set,
		promise,
		buffer,
		uint8Array,
		normal: {nested: 'value'},
	};

	const calls = [];
	const result = mapObject(input, (key, value) => {
		calls.push(key);
		return [key, value];
	}, {deep: true});

	// Should visit top-level keys and nested normal object
	assert.deepEqual(calls.toSorted((a, b) => a.localeCompare(b)), ['buffer', 'date', 'error', 'map', 'nested', 'normal', 'promise', 'regex', 'set', 'uint8Array']);

	// Counting keys alone cannot tell a recursed `Date` from an untouched one, since a
	// `Date` has no own enumerable keys either way. The result has to be the very same
	// object as the input, not a rebuilt copy.
	assert.ok(Object.is(result.date, date));
	assert.ok(Object.is(result.regex, regex));
	assert.ok(Object.is(result.error, error));
	assert.ok(Object.is(result.map, map));
	assert.ok(Object.is(result.set, set));
	assert.ok(Object.is(result.promise, promise));
	assert.ok(Object.is(result.buffer, buffer));
	assert.ok(Object.is(result.uint8Array, uint8Array));

	assert.deepEqual(result.normal, {nested: 'value'});
});

test('shallow mode does not recurse', () => {
	const nested = {one: 1};
	const array = [{two: 2}];

	const result = mapObject({nested, array}, (key, value) => [key, typeof value === 'number' ? value * 2 : value]);

	assert.equal(result.nested, nested);
	assert.equal(result.array, array);
	assert.deepEqual(result.nested, {one: 1});
});

test('symbol keys are ignored by default', () => {
	const symbol = Symbol('test');
	const input = {
		regular: 'value',
		[symbol]: 'symbolValue',
	};

	const result = mapObject(input, (key, value) => [key, value]);

	assert.ok(Object.hasOwn(result, 'regular'));
	assert.ok(!Object.hasOwn(result, symbol));
	assert.equal(result.regular, 'value');
	assert.equal(result[symbol], undefined);
});

test('symbol keys are included with includeSymbols option', () => {
	const symbol = Symbol('test');
	const input = {
		regular: 'value',
		[symbol]: 'symbolValue',
	};

	const result = mapObject(input, (key, value) => [key, value], {includeSymbols: true});

	assert.ok(Object.hasOwn(result, 'regular'));
	assert.ok(Object.hasOwn(result, symbol));
	assert.equal(result.regular, 'value');
	assert.equal(result[symbol], 'symbolValue');
});

test('symbol keys work with deep option', () => {
	const symbol1 = Symbol('outer');
	const symbol2 = Symbol('inner');
	const input = {
		regular: 'value',
		nested: {
			regularNested: 'nestedValue',
			[symbol2]: 'innerSymbol',
		},
		[symbol1]: 'outerSymbol',
	};

	const result = mapObject(input, (key, value) => [key, value], {
		deep: true,
		includeSymbols: true,
	});

	assert.equal(result.regular, 'value');
	assert.equal(result.nested.regularNested, 'nestedValue');
	assert.equal(result.nested[symbol2], 'innerSymbol');
	assert.equal(result[symbol1], 'outerSymbol');
});

test('handles invalid mapper return values gracefully', () => {
	assert.throws(() => {
		mapObject({a: 1}, () => null);
	}, {
		name: 'TypeError',
		message: 'Mapper must return an array or mapObjectSkip, got null',
	});

	assert.throws(() => {
		mapObject({a: 1}, () => 'string');
	}, {
		name: 'TypeError',
		message: 'Mapper must return an array or mapObjectSkip, got string',
	});

	assert.throws(() => {
		mapObject({a: 1}, () => []);
	}, {
		name: 'TypeError',
		message: 'Mapper must return an array with at least 2 elements [key, value], got 0 elements',
	});

	assert.throws(() => {
		mapObject({a: 1}, () => ['key']);
	}, {
		name: 'TypeError',
		message: 'Mapper must return an array with at least 2 elements [key, value], got 1 elements',
	});
});

test('handles non-configurable target properties gracefully', () => {
	const target = {};
	Object.defineProperty(target, 'readonly', {
		value: 'original',
		writable: false,
		configurable: false,
	});

	const result = mapObject({readonly: 'new', other: 'value'}, (key, value) => [key, value], {target});

	assert.equal(result, target);
	assert.equal(result.readonly, 'original'); // Should remain unchanged
	assert.equal(result.other, 'value'); // Should be added
});

test('handles property key collisions', () => {
	const result = mapObject({a: 1, b: 2}, (key, value) => ['same', value]);

	// Last value wins
	assert.deepEqual(result, {same: 2});
	assert.equal(Object.keys(result).length, 1);
});
