import {expectType} from 'tsd';
import mapObject = require('.');

const options: mapObject.Options = {};

const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
expectType<{[x: string]: 'foo'}>(newObject);
expectType<'foo'>(newObject.bar);

const obj = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'}
});
expectType<{baz: string} & {[x: string]: 'foo'}>(obj);
expectType<'foo'>(obj.bar);
expectType<string>(obj.baz);

const obj1 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
	deep: false
});
expectType<{baz: string} & {[x: string]: 'foo'}>(obj1);
expectType<'foo'>(obj1.bar);
expectType<string>(obj1.baz);

const obj2 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	deep: true
});
expectType<{[key: string]: unknown}>(obj2);
const obj3 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	deep: true,
	target: {bar: 'baz' as const}
});
expectType<{[key: string]: unknown}>(obj3);
expectType<'baz'>(obj3.bar);
