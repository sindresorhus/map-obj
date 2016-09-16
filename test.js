import test from 'ava';
import m from './';

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
	const actual = {one: 1, obj: {two: 2, three: 3}, arr: [{four: 4}, 5]};
	const expected = {one: 2, obj: {two: 4, three: 6}, arr: [{four: 8}, 5]};
	const fn = (key, val) => [key, typeof val === 'number' ? val * 2 : val];
	const obj = m(actual, fn, {deep: true});
	t.deepEqual(obj, expected);
});
