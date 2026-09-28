import {expectTypeOf} from 'nz';
import mapObject, {type Options, mapObjectSkip} from './index.js';

const options: Options = {};

const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
expectTypeOf(newObject).toBeAssignableTo<Record<string | symbol, 'foo'>>();
expectTypeOf(newObject.bar).toBe<'foo'>();

const object = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
});
expectTypeOf(object).toBeAssignableTo<{baz: string} & Record<string | symbol, 'foo'>>();
expectTypeOf(object.bar).toBe<'foo'>();
expectTypeOf(object.baz).toBe<string>();

const object1 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
	deep: false,
});
expectTypeOf(object1).toBeAssignableTo<{baz: string} & Record<string | symbol, 'foo'>>();
expectTypeOf(object1.bar).toBe<'foo'>();
expectTypeOf(object1.baz).toBe<string>();

const object2 = mapObject({foo: 'bar'}, (key, value) => [String(value), key], {
	deep: true,
});
expectTypeOf(object2).toBeAssignableTo<Record<string | symbol, unknown>>();
// Deep mapper parameters should be widened
mapObject({fooUpper: true, bAr: {bAz: true}}, (key, value, source) => {
	expectTypeOf(key).toBeAssignableTo<string>(); // Without includeSymbols, only string keys
	// In deep mode, source is the original input object
	expectTypeOf(source).toBe<{fooUpper: boolean; bAr: {bAz: boolean}}>();
	return [key, value];
}, {deep: true});

// Shallow mode: source should be the original input type
mapObject({alpha: 1, beta: 2}, (key, value, source) => {
	expectTypeOf(source).toBe<{alpha: number; beta: number}>();
	return [key, value];
});
const object3 = mapObject({foo: 'bar'}, (key, value) => [String(value), key], {
	deep: true,
	target: {bar: 'baz' as const},
});
expectTypeOf(object3).toBeAssignableTo<Record<string | symbol, unknown>>();
expectTypeOf(object3.bar).toBe<'baz'>();

mapObject({foo: 'bar'}, (key, value) => [value, key, {shouldRecurse: false}]);

mapObject({foo: 'bar'}, () => mapObjectSkip);

// IncludeSymbols option is available
const optionsWithSymbols: Options = {includeSymbols: true};

// Test symbol key support
const symbolKey = Symbol('test');
const inputWithSymbol = {foo: 'bar', [symbolKey]: 'value'};

// Test that symbol keys work
const resultWithSymbols = mapObject(inputWithSymbol, (key, value) => {
	expectTypeOf(key).toBeAssignableTo<string | symbol>(); // With includeSymbols, both string and symbol
	return [key, value];
}, {includeSymbols: true});
expectTypeOf(resultWithSymbols).toBeAssignableTo<Record<string | symbol, string>>();

// Test normal usage
const resultWithoutSymbols = mapObject(inputWithSymbol, (key, value) => {
	expectTypeOf(key).toBeAssignableTo<string>(); // Without includeSymbols, only string
	return [key, value];
});
expectTypeOf(resultWithoutSymbols).toBeAssignableTo<Record<string | symbol, string>>();

// Test deep mode with includeSymbols
mapObject({fooUpper: true, [Symbol('test')]: 'symbol'}, (key, value, source) => {
	expectTypeOf(key).toBeAssignableTo<string | symbol>(); // With includeSymbols in deep mode
	return [String(key), value];
}, {deep: true, includeSymbols: true});

// Verify that without includeSymbols, key type excludes symbols
mapObject({str: 'value'}, (key: string, value) => [key, value]);

// Verify that with includeSymbols, key can be symbol
mapObject({str: 'value'}, (key: string | symbol, value) => [String(key), value], {includeSymbols: true});
