import test from 'ava';
import mapObject, {mapObjectSkip} from './index.js';

test('main', t => {
	t.is(mapObject({foo: 'bar'}, key => [key, 'unicorn']).foo, 'unicorn');
	t.is(mapObject({foo: 'bar'}, (key, value) => ['unicorn', value]).unicorn, 'bar');
	t.is(mapObject({foo: 'bar'}, (key, value) => [value, key]).bar, 'foo');
});

test('mapper source argument is the original input (shallow)', t => {
	const input = {foo: {bar: 1}};
	mapObject(input, (key, value, source) => {
		t.is(source, input);
		return [key, value];
	});
});

test('mapper source argument is the original input when using target', t => {
	const input = {x: 1};
	const target = {y: 2};
	mapObject(input, (key, value, source) => {
		t.is(source, input);
		t.not(source, target);
		return [key, value];
	}, {target});
	// Ensure target still works as target
	t.deepEqual(target, {y: 2, x: 1});
});

test('target option', t => {
	const target = {};
	t.is(mapObject({foo: 'bar'}, (key, value) => [value, key], {target}), target);
	t.is(target.bar, 'foo');
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

test('mapper source arg is the original input (deep)', t => {
	const input = {a: {b: {c: 1}}};
	mapObject(input, (key, value, source) => {
		// Should always be the root input object
		t.is(source, input);
		return [key, value];
	}, {deep: true});
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

	const input = {
		date,
		regex,
		error,
		normal: {nested: 'value'},
	};

	const calls = [];
	mapObject(input, (key, value) => {
		calls.push(key);
		return [key, value];
	}, {deep: true});

	// Should visit top-level keys and nested normal object
	t.deepEqual(calls.sort(), ['date', 'error', 'nested', 'normal', 'regex']);
});
