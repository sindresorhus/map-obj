import test from 'ava';
import mapObject, {mapObjectSkip} from './index.js';

test('main', t => {
	t.is(mapObject({foo: 'bar'}, key => [key, 'unicorn']).foo, 'unicorn');
	t.is(mapObject({foo: 'bar'}, (key, value) => ['unicorn', value]).unicorn, 'bar');
	t.is(mapObject({foo: 'bar'}, (key, value) => [value, key]).bar, 'foo');
});

test('mapper source argument is always the original input', t => {
	const input = {foo: {bar: 1}, a: {b: {c: 1}}};

	// Test shallow mode
	mapObject(input, (key, value, source) => {
		t.is(source, input);
		return [key, value];
	});

	// Test deep mode
	mapObject(input, (key, value, source) => {
		t.is(source, input); // Should always be the root input object, not nested objects
		return [key, value];
	}, {deep: true});
});

test('target option', t => {
	const input = {x: 1, foo: 'bar'};
	const target = {y: 2};

	// Test that the function returns the target object and source argument is correct
	const result = mapObject(input, (key, value, source) => {
		t.is(source, input);
		t.not(source, target);
		return [key === 'foo' ? 'baz' : key, value];
	}, {target});

	t.is(result, target);
	t.deepEqual(target, {y: 2, x: 1, baz: 'bar'});
});

test('deep option', t => {
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
	t.deepEqual(actual, expected);
});

test('shouldRecurse mapper option', t => {
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

	const mapper = (key, value) => {
		if (key === 'object') {
			return [key, value, {shouldRecurse: false}];
		}

		return [key, typeof value === 'number' ? value * 2 : value];
	};

	const actual = mapObject(object, mapper, {deep: true});
	t.deepEqual(actual, expected);
});

test('nested arrays', t => {
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
	t.deepEqual(actual, expected);
});

test('handles circular references', t => {
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

	t.deepEqual(actual, expected);
});

test('validates input', t => {
	t.throws(() => {
		mapObject(1, () => {});
	}, {
		instanceOf: TypeError,
	});

	t.throws(() => {
		mapObject([1, 2], (key, value) => [value, key]);
	}, {
		instanceOf: TypeError,
	});
});

test('__proto__ keys are safely dropped', t => {
	const input = {['__proto__']: {one: 1}};
	const output = mapObject(input, (key, value) => [key, value]);
	t.deepEqual(output, {});

	// AVA's equality checking isn't quite strict enough to catch the difference
	// between plain objects as prototypes and Object.prototype, so we also check
	// the prototype by identity
	t.is(Object.getPrototypeOf(output), Object.prototype);
});

test('remove keys (#36)', t => {
	const object = {
		one: 1,
		two: 2,
	};

	const expected = {
		one: 1,
	};

	const mapper = (key, value) => value === 1 ? [key, value] : mapObjectSkip;
	const actual = mapObject(object, mapper, {deep: true});
	t.deepEqual(actual, expected);
});

test('should not recurse into Jest-like matchers', t => {
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
		t.not(key, '$$typeof');
		t.not(key, 'asymmetricMatch');
		t.not(key, 'toString');
		return [key, value];
	}, {deep: true});

	t.is(result.matcher, jestMatcher);
	t.is(result.normal.nested, 'value');
	t.is(calls, 3); // 'normal', 'nested', 'matcher'
});

test('options object is not mutated', t => {
	const options = {deep: true, target: {}};
	const originalOptions = {...options};

	mapObject({a: 1}, (key, value) => [key, value], options);

	t.deepEqual(options, originalOptions);
});

test('built-in objects are not recursed into', t => {
	const date = new Date();
	const regex = /test/;
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
	mapObject(input, (key, value) => {
		calls.push(key);
		return [key, value];
	}, {deep: true});

	// Should visit top-level keys and nested normal object
	t.deepEqual(calls.sort(), ['buffer', 'date', 'error', 'map', 'nested', 'normal', 'promise', 'regex', 'set', 'uint8Array']);
});

test('symbol keys are ignored by default', t => {
	const symbol = Symbol('test');
	const input = {
		regular: 'value',
		[symbol]: 'symbolValue',
	};

	const result = mapObject(input, (key, value) => [key, value]);

	t.true('regular' in result);
	t.false(symbol in result);
	t.is(result.regular, 'value');
	t.is(result[symbol], undefined);
});

test('symbol keys are included with includeSymbols option', t => {
	const symbol = Symbol('test');
	const input = {
		regular: 'value',
		[symbol]: 'symbolValue',
	};

	const result = mapObject(input, (key, value) => [key, value], {includeSymbols: true});

	t.true('regular' in result);
	t.true(symbol in result);
	t.is(result.regular, 'value');
	t.is(result[symbol], 'symbolValue');
});

test('symbol keys work with deep option', t => {
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

	t.is(result.regular, 'value');
	t.is(result.nested.regularNested, 'nestedValue');
	t.is(result.nested[symbol2], 'innerSymbol');
	t.is(result[symbol1], 'outerSymbol');
});

test('handles invalid mapper return values gracefully', t => {
	t.throws(() => {
		mapObject({a: 1}, () => null);
	}, {
		instanceOf: TypeError,
		message: 'Mapper must return an array or mapObjectSkip, got null',
	});

	t.throws(() => {
		mapObject({a: 1}, () => 'string');
	}, {
		instanceOf: TypeError,
		message: 'Mapper must return an array or mapObjectSkip, got string',
	});

	t.throws(() => {
		mapObject({a: 1}, () => []);
	}, {
		instanceOf: TypeError,
		message: 'Mapper must return an array with at least 2 elements [key, value], got 0 elements',
	});

	t.throws(() => {
		mapObject({a: 1}, () => ['key']);
	}, {
		instanceOf: TypeError,
		message: 'Mapper must return an array with at least 2 elements [key, value], got 1 elements',
	});
});

test('handles non-configurable target properties gracefully', t => {
	const target = {};
	Object.defineProperty(target, 'readonly', {
		value: 'original',
		writable: false,
		configurable: false,
	});

	const result = mapObject({readonly: 'new', other: 'value'}, (key, value) => [key, value], {target});

	t.is(result, target);
	t.is(result.readonly, 'original'); // Should remain unchanged
	t.is(result.other, 'value'); // Should be added
});

test('handles property key collisions', t => {
	const result = mapObject({a: 1, b: 2}, (key, value) => ['same', value]);

	// Last value wins
	t.deepEqual(result, {same: 2});
	t.is(Object.keys(result).length, 1);
});
