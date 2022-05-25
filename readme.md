# map-obj

> Map object keys and values into a new object

## Install

```sh
npm install map-obj
```

## Usage

```js
import mapObject, {mapObjectSkip} from 'map-obj';

const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
//=> {bar: 'foo'}

const newObject = mapObject({FOO: true, bAr: {bAz: true}}, (key, value) => [key.toLowerCase(), value]);
//=> {foo: true, bar: {bAz: true}}

const newObject = mapObject({FOO: true, bAr: {bAz: true}}, (key, value) => [key.toLowerCase(), value], {deep: true});
//=> {foo: true, bar: {baz: true}}

const newObject = mapObject({one: 1, two: 2}, (key, value) => value === 1 ? [key, value] : mapObjectSkip);
//=> {one: 1}
```

## API

### mapObject(source, mapper, options?)

#### source

Type: `object`

The source object to copy properties from.

#### mapper

Type: `(sourceKey, sourceValue, source, path) => [targetKey, targetValue, mapperOptions?] | mapObjectSkip`

A mapping function.

##### path

Type: `string[]`\

If `deep === true`, this is the sequence of keys to reach the current value from the `source`;
otherwise it is an empty array.

For arrays, the key is the index of the element being mapped.

Example:
```js
const originalObject = {first: [{value: 1}, {value: 2}, {value: 3}], second: [{value: 4}, {value: 5}, {value: 6}]};
const mapper = (key, value, source, path) => path.includes('first') || path.includes(1)
	? [`__${key}__`, value]
	: [key, value];

const newObject = mapObject(originalObject, mapper, {deep: true});
//=> {__first__: [{__value__: 1}, {__value__: 2}, {__value__: 3}], second: [{value: 4}, {__value__: 5}, {value: 6}]}
```

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

---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-map-obj?utm_source=npm-map-obj&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
