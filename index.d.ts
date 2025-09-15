/**
Return this value from a `mapper` function to remove a key from an object.

@example
```
import mapObject, {mapObjectSkip} from 'map-obj';

const object = {one: 1, two: 2}
const mapper = (key, value) => value === 1 ? [key, value] : mapObjectSkip
const result = mapObject(object, mapper);

console.log(result);
//=> {one: 1}
```
*/
export const mapObjectSkip: unique symbol;

export type Mapper<
	SourceObjectType extends Record<string, unknown>,
	MappedObjectKeyType extends string,
	MappedObjectValueType,
> = (
	sourceKey: keyof SourceObjectType,
	sourceValue: SourceObjectType[keyof SourceObjectType],
	source: SourceObjectType
) => [
	targetKey: MappedObjectKeyType,
	targetValue: MappedObjectValueType,
	mapperOptions?: MapperOptions,
] | typeof mapObjectSkip;

/**
Mapper used when `{deep: true}` is enabled.

In deep mode we may visit nested objects with keys and values unrelated to the top-level object, so we intentionally widen the key and value types.
*/
type DeepMapper<
	SourceObjectType extends Record<string, unknown>,
	MappedObjectKeyType extends string,
	MappedObjectValueType,
> = (
	sourceKey: string,
	sourceValue: unknown,
	source: SourceObjectType
) => [
	targetKey: MappedObjectKeyType,
	targetValue: MappedObjectValueType,
	mapperOptions?: MapperOptions,
] | typeof mapObjectSkip;

export type Options = {
	/**
	Recurse nested objects and objects in arrays.

	@default false

	Built-in objects like `RegExp`, `Error`, `Date`, and `Blob` are not recursed into. Special objects like Jest matchers are also automatically excluded.
	*/
	readonly deep?: boolean;

	/**
	The target object to map properties on to.

	@default {}
	*/
	readonly target?: Record<string, unknown>;
};

export type DeepOptions = {
	readonly deep: true;
} & Options;

export type TargetOptions<TargetObjectType extends Record<string, unknown>> = {
	readonly target: TargetObjectType;
} & Options;

export type MapperOptions = {
	/**
	Whether `targetValue` should be recursed.

	Requires `deep: true`.

	@default true
	*/
	readonly shouldRecurse?: boolean;
};

/**
Map object keys and values into a new object.

@param source - The source object to copy properties from.
@param mapper - A mapping function.

@example
```
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
*/
export default function mapObject<
	SourceObjectType extends Record<string, unknown>,
	TargetObjectType extends Record<string, unknown>,
	MappedObjectKeyType extends string,
	MappedObjectValueType,
>(
	source: SourceObjectType,
	mapper: DeepMapper<SourceObjectType, MappedObjectKeyType, MappedObjectValueType>,
	options: DeepOptions & TargetOptions<TargetObjectType>
): TargetObjectType & Record<string, unknown>;
export default function mapObject<
	SourceObjectType extends Record<string, unknown>,
	MappedObjectKeyType extends string,
	MappedObjectValueType,
>(
	source: SourceObjectType,
	mapper: DeepMapper<SourceObjectType, MappedObjectKeyType, MappedObjectValueType>,
	options: DeepOptions
): Record<string, unknown>;
export default function mapObject<
	SourceObjectType extends Record<string, unknown>,
	TargetObjectType extends Record<string, unknown>,
	MappedObjectKeyType extends string,
	MappedObjectValueType,
>(
	source: SourceObjectType,
	mapper: Mapper<
		SourceObjectType,
		MappedObjectKeyType,
		MappedObjectValueType
	>,
	options: TargetOptions<TargetObjectType>
): TargetObjectType & Record<MappedObjectKeyType, MappedObjectValueType>;
export default function mapObject<
	SourceObjectType extends Record<string, unknown>,
	MappedObjectKeyType extends string,
	MappedObjectValueType,
>(
	source: SourceObjectType,
	mapper: Mapper<
		SourceObjectType,
		MappedObjectKeyType,
		MappedObjectValueType
	>,
	options?: Options
): Record<MappedObjectKeyType, MappedObjectValueType>;
