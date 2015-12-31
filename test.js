import test from 'ava';
import m from './';

test(t => {
	t.is(m({foo: 'bar'}, key => [key, 'unicorn']).foo, 'unicorn');
	t.is(m({foo: 'bar'}, (key, val) => ['unicorn', val]).unicorn, 'bar');
	t.is(m({foo: 'bar'}, (key, val) => [val, key]).bar, 'foo');

	const target = {};
	t.is(m({foo: 'bar'}, (key, val) => [val, key], target), target);
	t.is(target.bar, 'foo');
});
