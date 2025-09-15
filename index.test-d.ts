import {expectType, expectAssignable} from 'tsd';
import mapObject, {type Options, mapObjectSkip} from './index.js';

const options: Options = {};

const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
expectAssignable<Record<string | symbol, 'foo'>>(newObject);
expectType<'foo'>(newObject.bar);

const object = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
});
expectAssignable<{baz: string} & Record<string | symbol, 'foo'>>(object);
expectType<'foo'>(object.bar);
expectType<string>(object.baz);

const object1 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
	deep: false,
});
expectAssignable<{baz: string} & Record<string | symbol, 'foo'>>(object1);
expectType<'foo'>(object1.bar);
expectType<string>(object1.baz);

const object2 = mapObject({foo: 'bar'}, (key, value) => [String(value), key], {
	deep: true,
});
expectAssignable<Record<string | symbol, unknown>>(object2);
// Deep mapper parameters should be widened
mapObject({fooUpper: true, bAr: {bAz: true}}, (key, value, source) => {
	expectAssignable<string>(key); // Without includeSymbols, only string keys
	// In deep mode, source is the original input object
	expectType<{fooUpper: boolean; bAr: {bAz: boolean}}>(source);
	return [String(key), value];
}, {deep: true});

// Shallow mode: source should be the original input type
mapObject({alpha: 1, beta: 2}, (key, value, source) => {
	expectType<{alpha: number; beta: number}>(source);
	return [key, value];
});
const object3 = mapObject({foo: 'bar'}, (key, value) => [String(value), key], {
	deep: true,
	target: {bar: 'baz' as const},
});
expectAssignable<Record<string | symbol, unknown>>(object3);
expectType<'baz'>(object3.bar);

mapObject({foo: 'bar'}, (key, value) => [value, key, {shouldRecurse: false}]);

mapObject({foo: 'bar'}, () => mapObjectSkip);

// IncludeSymbols option is available
const optionsWithSymbols: Options = {includeSymbols: true};

// Test symbol key support
const symbolKey = Symbol('test');
const inputWithSymbol = {foo: 'bar', [symbolKey]: 'value'};

// Test that symbol keys work
const resultWithSymbols = mapObject(inputWithSymbol, (key, value) => {
	expectAssignable<string | symbol>(key); // With includeSymbols, both string and symbol
	return [key, value];
}, {includeSymbols: true});
expectAssignable<Record<string | symbol, string>>(resultWithSymbols);

// Test normal usage
const resultWithoutSymbols = mapObject(inputWithSymbol, (key, value) => {
	expectAssignable<string>(key); // Without includeSymbols, only string
	return [key, value];
});
expectAssignable<Record<string | symbol, string>>(resultWithoutSymbols);

// Test deep mode with includeSymbols
mapObject({fooUpper: true, [Symbol('test')]: 'symbol'}, (key, value, source) => {
	expectAssignable<string | symbol>(key); // With includeSymbols in deep mode
	return [String(key), value];
}, {deep: true, includeSymbols: true});

// Verify that without includeSymbols, key type excludes symbols
mapObject({str: 'value'}, (key: string, value) => [key, value]);

// Verify that with includeSymbols, key can be symbol
mapObject({str: 'value'}, (key: string | symbol, value) => [String(key), value], {includeSymbols: true});
