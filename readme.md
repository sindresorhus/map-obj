# map-obj [![Build Status](https://travis-ci.org/sindresorhus/map-obj.svg?branch=master)](https://travis-ci.org/sindresorhus/map-obj)

> Map object keys and values into a new object


## Install

```
$ npm install map-obj
```


## Usage

```js
const mapObject = require('map-obj');

const newObject = mapObject({foo: 'bar'}, (key, value) => [value, key]);
//=> {bar: 'foo'}
```


## API

### mapObject(source, mapper, options?)

#### source

Type: `object`

Source object to copy properties from.

#### mapper

Type: `Function`

Mapping function.

- It has signature `mapper(sourceKey, sourceValue, source)`.
- It must return a two item array: `[targetKey, targetValue]`.

#### options

Type: `object`

##### deep

Type: `boolean | Function`<br>
Default: `false`

Recursing behavior for nested objects and objects in arrays.

Deep Value can be boolean:

- If `true`, it recurses all nested objects and objects in arrays.

Or a function which has the following properties:

- It has signature `(sourceKey: string) => boolean`.
- Returning `true` states the value related to the currently iterated `sourceKey` shall be recursed if it is a nested object, false otherwise.

Example:

```js
const mapObject = require('map-obj');

const newObject = mapObject(
    {foo: {bar: 42}, lorem: {ipsum: 'dolor'}},
    (key, value) => [key.toUpperCase(), value],
    {deep: key => key === 'foo'} // Recurses only on nested objects of key `foo`.
);
/*
{
	FOO: {
		BAR: 42
	},
	{
		LOREM: {
			ipsum: 'dolor'
		}
	}
}
*/
```

##### target

Type: `object`<br>
Default: `{}`

Target object to map properties on to.


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
