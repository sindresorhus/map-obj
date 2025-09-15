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

// Include symbol keys
const symbol = Symbol('foo');
const newObject = mapObject({bar: 'baz', [symbol]: 'qux'}, (key, value) => [key, value], {includeSymbols: true});
//=> {bar: 'baz', [Symbol(foo)]: 'qux'}
```

## API

### mapObject(source, mapper, options?)

#### source

Type: `object`

The source object to copy properties from.

#### mapper

Type: `(sourceKey, sourceValue, source) => [targetKey, targetValue, mapperOptions?] | mapObjectSkip`

A mapping function.

> [!NOTE]
> When `options.deep` is `true`, the mapper receives keys and values from nested objects and arrays. The `sourceKey` parameter is typed as `string | symbol` and `sourceValue` as `unknown` to reflect the actual runtime behavior when recursing into unknown shapes. The third argument `source` is always the original input object, not the current nested owner.

##### mapperOptions

Type: `object`

###### shouldRecurse

Type: `boolean`\
Default: `true`

Whether to recurse into `targetValue`.

Requires `deep: true`.

#### options

Type: `object`

##### deep

Type: `boolean`\
Default: `false`

Recurse nested objects and objects in arrays.

Built-in objects like `RegExp`, `Error`, `Date`, `Map`, `Set`, `WeakMap`, `WeakSet`, `Promise`, `ArrayBuffer`, `DataView`, typed arrays (Uint8Array, etc.), and `Blob` are not recursed into. Special objects like Jest matchers are also automatically excluded.

##### includeSymbols

Type: `boolean`\
Default: `false`

Include symbol keys in the iteration.

By default, symbol keys are completely ignored and not passed to the mapper function. When enabled, the mapper will also be called with symbol keys from the source object, allowing them to be transformed or included in the result. Only enumerable symbol properties are included.

##### target

Type: `object`\
Default: `{}`

The target object to map properties onto.

### mapObjectSkip

Return this value from a `mapper` function to exclude the key from the new object.

```js
import mapObject, {mapObjectSkip} from 'map-obj';

const object = {one: 1, two: 2};
const mapper = (key, value) => value === 1 ? [key, value] : mapObjectSkip;
const result = mapObject(object, mapper);

console.log(result);
//=> {one: 1}
```

## Related

- [filter-obj](https://github.com/sindresorhus/filter-obj) - Filter object keys and values into a new object
