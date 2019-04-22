import test from 'ava';
import mapObject from '.';

test('main', t => {
	t.is(mapObject({foo: 'bar'}, key => [key, 'unicorn']).foo, 'unicorn');
	t.is(mapObject({foo: 'bar'}, (key, value) => ['unicorn', value]).unicorn, 'bar');
	t.is(mapObject({foo: 'bar'}, (key, value) => [value, key]).bar, 'foo');
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
			three: 3
		},
		array: [
			{
				four: 4
			},
			5
		]
	};

	const expected = {
		one: 2,
		object: {
			two: 4,
			three: 6
		},
		array: [
			{
				four: 8
			},
			5
		]
	};

	const fn = (key, value) => [key, typeof value === 'number' ? value * 2 : value];
	const actual = mapObject(object, fn, {deep: true});
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
					a: 3
				}
			]
		]
	};

	const expected = {
		array: [
			[
				0,
				1,
				2,
				{
					a: 6
				}
			]
		]
	};

	const fn = (key, value) => [key, typeof value === 'number' ? value * 2 : value];
	const actual = mapObject(object, fn, {deep: true});
	t.deepEqual(actual, expected);
});

test('handles circular references', t => {
	const object = {
		one: 1,
		array: [
			2
		]
	};
	object.circular = object;
	object.array2 = object.array;
	object.array.push(object);

	const fn = (key, value) => [key.toUpperCase(), value];
	const actual = mapObject(object, fn, {deep: true});

	const expected = {
		ONE: 1,
		ARRAY: [
			2
		]
	};
	expected.CIRCULAR = expected;
	expected.ARRAY2 = expected.ARRAY;
	expected.ARRAY.push(expected);

	t.deepEqual(actual, expected);
});
