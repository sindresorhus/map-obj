import test from 'ava';
import m from '.';

test('main', t => {
	t.is(m({foo: 'bar'}, key => [key, 'unicorn']).foo, 'unicorn');
	t.is(m({foo: 'bar'}, (key, val) => ['unicorn', val]).unicorn, 'bar');
	t.is(m({foo: 'bar'}, (key, val) => [val, key]).bar, 'foo');
});

test('target option', t => {
	const target = {};
	t.is(m({foo: 'bar'}, (key, val) => [val, key], {target}), target);
	t.is(target.bar, 'foo');
});

test('deep option', t => {
	const obj = {one: 1, obj: {two: 2, three: 3}, arr: [{four: 4}, 5]};
	const expected = {one: 2, obj: {two: 4, three: 6}, arr: [{four: 8}, 5]};
	const fn = (key, val) => [key, typeof val === 'number' ? val * 2 : val];
	const actual = m(obj, fn, {deep: true});
	t.deepEqual(actual, expected);
});

test('handles circular references', t => {
	const obj = {one: 1, arr: [2]};
	obj.circular = obj;
	obj.arr2 = obj.arr;
	obj.arr.push(obj);

	const fn = (key, val) => [key.toUpperCase(), val];
	const actual = m(obj, fn, {deep: true});

	const expected = {ONE: 1, ARR: [2]};
	expected.CIRCULAR = expected;
	expected.ARR2 = expected.ARR;
	expected.ARR.push(expected);

	t.deepEqual(actual, expected);
});
