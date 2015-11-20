'use strict';
var test = require('ava');
var mapObj = require('./');

test(function (t) {
	t.assert(mapObj({foo: 'bar'}, function (key) {
		return [key, 'unicorn'];
	}).foo === 'unicorn');

	t.assert(mapObj({foo: 'bar'}, function (key, val) {
		return ['unicorn', val];
	}).unicorn === 'bar');

	t.assert(mapObj({foo: 'bar'}, function (key, val) {
		return [val, key];
	}).bar === 'foo');

	var target = {};

	t.assert(mapObj({foo: 'bar'}, function (key, val) {
		return [val, key];
	}, target) === target);

	t.assert(target.bar === 'foo');

	t.end();
});
