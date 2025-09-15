import {expectType, expectAssignable} from 'tsd';
import mapObject, {type Options, mapObjectSkip} from './index.js';

const options: Options = {};

const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
expectType<Record<string, 'foo'>>(newObject);
expectType<'foo'>(newObject.bar);

const object = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
});
expectType<{baz: string} & Record<string, 'foo'>>(object);
expectType<'foo'>(object.bar);
expectType<string>(object.baz);

const object1 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
	deep: false,
});
expectType<{baz: string} & Record<string, 'foo'>>(object1);
expectType<'foo'>(object1.bar);
expectType<string>(object1.baz);

const object2 = mapObject({foo: 'bar'}, (key, value) => [String(value), key], {
	deep: true,
});
expectType<Record<string, unknown>>(object2);
// Deep mapper parameters should be widened
mapObject({fooUpper: true, bAr: {bAz: true}}, (key, value, source) => {
	expectType<string>(key);
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
expectAssignable<Record<string, unknown>>(object3);
expectType<'baz'>(object3.bar);

mapObject({foo: 'bar'}, (key, value) => [value, key, {shouldRecurse: false}]);

mapObject({foo: 'bar'}, () => mapObjectSkip);
