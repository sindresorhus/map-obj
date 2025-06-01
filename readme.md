# map-obj

> Map object keys and values into a new object

## Install

```sh
npm install map-obj
```

## Usage

```js
import mapObject, {mapObjectSkip} from 'map-obj';

// Swap keys and values
const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
//=> {bar: 'foo'}

// Convert keys to lowercase (shallow)
const newObject = mapObject({FOO: true, bAr: {bAz: true}}, (key, value) => [key.toLowerCase(), value]);
//=> {foo: true, bar: {bAz: true}}

// Convert keys to lowercase (deep recursion)
const newObject = mapObject({FOO: true, bAr: {bAz: true}}, (key, value) => [key.toLowerCase(), value], {deep: true});
//=> {foo: true, bar: {baz: true}}

// Filter out specific values
const newObject = mapObject({one: 1, two: 2}, (key, value) => value === 1 ? [key, value] : mapObjectSkip);
//=> {one: 1}
```

## API

### mapObject(source, mapper, options?)

#### source

Type: `object`

The source object to copy properties from.

#### mapper

Type: `(sourceKey, sourceValue, source) => [targetKey, targetValue, mapperOptions?] | mapObjectSkip`

A mapping function.

##### mapperOptions

Type: `object`

###### shouldRecurse

Type: `boolean`\
Default: `true`

Whether `targetValue` should be recursed.

Requires `deep: true`.

#### options

Type: `object`

##### deep

Type: `boolean`\
Default: `false`

Recurse nested objects and objects in arrays.

##### target

Type: `object`\
Default: `{}`

The target object to map properties on to.

### mapObjectSkip

Return this value from a `mapper` function to exclude the key from the new object.

```js
import mapObject, {mapObjectSkip} from 'map-obj';

const object = {one: 1, two: 2}
const mapper = (key, value) => value === 1 ? [key, value] : mapObjectSkip
const result = mapObject(object, mapper);

console.log(result);
//=> {one: 1}
```

## Related

- [filter-obj](https://github.com/sindresorhus/filter-obj) - Filter object keys and values into a new object
