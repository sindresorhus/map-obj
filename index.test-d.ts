import {expectType, expectAssignable} from 'tsd';
import mapObject = require('./index.js');

const options: mapObject.Options = {};

const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
expectType<{[key: string]: 'foo'}>(newObject);
expectType<'foo'>(newObject.bar);

const object = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'}
});
expectType<{baz: string} & {[x: string]: 'foo'}>(object);
expectType<'foo'>(object.bar);
expectType<string>(object.baz);

const object1 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	target: {baz: 'baz'},
	deep: false
});
expectType<{baz: string} & {[x: string]: 'foo'}>(object1);
expectType<'foo'>(object1.bar);
expectType<string>(object1.baz);

const object2 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	deep: true
});
expectType<{[key: string]: unknown}>(object2);
const object3 = mapObject({foo: 'bar'}, (key, value) => [value, key], {
	deep: true,
	target: {bar: 'baz' as const}
});
expectAssignable<{[key: string]: unknown}>(object3);
expectType<'baz'>(object3.bar);

mapObject({foo: 'bar'}, (key, value) => [value, key, {shouldRecurse: false}]);

mapObject({foo: 'bar'}, () => mapObject.mapObjSkip);
