# EDATA API [![NPM Version](https://img.shields.io/npm/v/edata.svg)](https://www.npmjs.com/package/edata)

<!-- toc -->

- [Builtin](#builtin)
    + [- import library](#--import-library)
    + [- initialize](#--initialize)
    + [- .get](#--get)
    + [- .set](#--set)
    + [- .getset](#--getset)
    + [- .unset](#--unset)
    + [- .unwrap](#--unwrap)
    + [- .of](#--of)
    + [- .cut](#--cut)
    + [- .context](#--context)
    + [- .closest](#--closest)
    + [- .combine](#--combine)
    + [- .setComputed](#--setcomputed)
    + [- .pop](#--pop)
- [plugins](#plugins)
  * [`plugins/set-many`](#pluginsset-many)
    + [- .setMany](#--setmany)
  * [`plugins/actions`](#pluginsactions)
    + [- .dispatch](#--dispatch)

<!-- tocstop -->

## Builtin

#### - import library

- For ES6 Module

```js
import edata, {EdataBaseClass} from 'edata'
const root = edata()(initData)
```

> The lib expose a default `edata` function to use

The `EdataBaseClass` can be used for sub-class your own implemention of `edata`.

You can `extends` this class to add your own methods:

```js
class MyBaseClass extends EdataBaseClass {
    my_method(){
        // do sth.
    }
}
const root = edata({ baseClass: MyBaseClass })(initData);
root.my_method();
```

- For CommonJS module

```js
const edata = require('edata').default
const root = edata()(initData)
```

*Notice*

Be careful when using `class` keyword, by default, you have to transpile your code to `ES5` to run correctly.

If you need to use `class` without transpile, you should import `edata/dist/node`, or `edata/dist/es`.

#### - initialize

```js
var root = edata(options: object)(initData: any)
```

A `edata` is an `edata` with some helper methods, like `get`, `set` etc., so

The `root` is a *edata*, with all nested data wrapped, and `root.observer` is also an edata object, you can listen to `change` event for children changes.

```
edata = EventEmitter + '.value' + '.get' + '.set' ...
```

`edata` convert nested `initData` object into nested `EventEmitter` instance.

`options` has below options:
- **baseClass**: Default implementation is [here](https://github.com/futurist/edata/blob/2e2c73b2d8aefaca61b4bc38b920c449c3f747ad/src/index.js#L556)
- **unwrapConfig**: when `unwrap`, you can add default config
- **plugins**: You can add your own API with this option

*return: root edata*

```js
import edata from 'edata'
var edataFactory = edata({
    baseClass: MyBaseClass
})
const root1 = edataFactory(data1)
const root2 = edataFactory(data2)
root1.on('change', onChangeHandler)
...
```

#### - .get

```js
edata.get(path: string|string[])
```

> get nested edata from path, path is array of string or dot(`"."`) seperated string.

*return: edata at `path`*

```js
var z = root.get('x.y.z')
// or
var z = root.get(['x','y','z'])
z.value // 2
z.value = 10
```

#### - .set

```js
edata.set(path?: string|string[], value?: any, descriptor?: object)
```

> set nested edata value from path, same rule as `get` method. The `descriptor` only applied when path not exists.

*return: edata for `value`, at `path`*

`path` can contain `a.[3]` alike string denote `3` is an array element of `a`.

`value` can be any data types, if `path` is omitted, set value into edata itself.

If `value` is a **edata object**, then it's an **atom data**, which will not be wrapped inside.

`descriptor` is optional, same as 3rd argument of `Object.defineProperty`, this can e.g. create non-enumerable edata object which will be hidden when `unwrap`.

If data not exist in `path`, all intermediate object will be created.

```js
var z = root.set('x.a', 10)
z.value  // 10

// same as: (only if x.a exits)
root.get('x.a').set(10)
root.get('x.a').value = 10

var z = root.set('x.c', [], {enumerable: false})  // c is non-enumerable
Object.keys( z.get('x').value )  // ['a']

root.unwrap()  // {x: {y: {z: 1}}, a: 10}  // `c` is hidden!

root.set(`arr.[0]`, 10)
root.get('arr.0').value  // 10

root.unwrap()  // {x: {y: {z: 1}}, a: 10, arr:[10]}  // `arr` is array!

```

#### - .getset

```js
edata.getset(path?: string|string[], function(prevValue:edata|any, empty?: boolean)->newValue, descriptor: object)
```

> like `set`, but value is from a function, it let you set `value` based on previous value, the `descriptor` only applied when `empty` is `true`.

*return: edata for `newValue`, at `path`*

```js
// x.a = 10
var z = root.getset('x.a', val=>val + 1)
z.value  // 11
```

#### - .unset

```js
edata.unset(path: string|string[])
```

> delete `edata` or `value` in `path`

*return: deleted data been **unwrapped***

```js
var z = root.unset('x.b')
z // 5
```

#### - .unwrap

```js
edata.unwrap(path?: string|string[], config?: {json: false})
```

> unwrap data and nested data while keep data structure, any level of `wrapper` will be stripped.

If set `config` arg with `{json: true}`, then any circular referenced data will be set `undefined`, suitable for `JSON.stringify`.

If set `config` arg with `{map: value=>...}`, then the final value is first mapped, then returned, and the return value of `unwrapConfig` will be merged into this config.

The `.toJSON()` also invoke `.unwrap`, using `{json: true}` config.

*return: unwrapped data*

```js
var z = root.unwrap()

console.log(z) // {x: {y: {z: 11}}, a: [10]},   x.c is hidden

JSON.stringify(z) // '{"x":{"y":{"z":11}},"a":[10]}'
```

#### - .of

```js
edata.of(value: any)
```

> Wrap value into an edata.

This is important for performance when `.unwrap` for large deep tree, unwrap will only unwrap outer level of `edata(edata)` structure, and will not going deep for better performance, so `edata.of(value)` is made atom.

*return: edata*

```js
var d = root.set('a.b', root.of({x: {y: 10}}));
d.get('a.b.x.y') // -> undefined
d.unwrap('a.b') // {x: {y: 10}}
```


#### - .cut

```js
edata.cut(path: string|string[], from = root, filter?: ({data, type, path}):boolean)
```

> get nested edata from path, and attach a `observer` edata object to observe scope mutations that the `root.path` starts with path.

*return: `edata`, which have a `.observer` edata object*

The `edata.observer` edata object's value has `path` property to reflect the sub path of the cut data.

```js
var xy = root.cut('x.y')
xy.observer.on('change', ({data, type, path})=>console.log(type, path))
xy.set('z', 1)
// x.y changed! ['z']
```

#### - .context

```js
edata.context()
```

> Find `edata` up from **context parent**, which has been `.cut()`d and has `observer` on it.

*return: closest cut `edata` or `root`*

```js
var xy = root.cut('x.y')
assert.equal(xy.get('x.y.z').context(), xy)
```

#### - .closest

```js
edata.closest(path: string|string[])
```

> Find `edata` up from **closest parent**, with matching path using `RegExp` or string.

Empty `path` (`null` or `undefined`) will return `parent edata`.

*return: `edata` or `undefined` if not find*

```js
var xy = root.get('x.y')
var x = xy.closest('x')  // get closest x
var parent = xy.closest()  // get parent of x
```


#### - .combine

```js
edata.combine(edataArray: string[] | edata[]): edataCombined
```

> Combine array of source edata into one target edata, any change of source will emit change event of target

Combined edata has below additional methods:
- `.check()` Check the source edata array for change now
- `.end()` End the combine, stop observe changes from source edata array

*return: combined `edata`*

```js
var abxy = root.combine(['a.b', 'x.y'])
abxy.map(callback) //called when 'a.b' or 'x.y' changed
```

#### - .setComputed

```js
edata.setComputed(path: string | string[], edataArray: any[], combineFunc: (args: edata[])=>void): IDisposer
```

> Set target path from edataArray changes, using return value of combineFunc

*return: {function} Disposer to end the computation*

```js
const root = edata()({
  firstName: 'Hello',
  lastName: 'World'
})
root.setComputed(
  'fullName',
  ['firstName', 'lastName'],
  ([firstName, lastName]) => firstName + ' ' + lastName
)
assert.equal(root.unwrap('fullName'), 'Hello World')
root.set('firstName', 'Green')
assert.equal(root.unwrap('fullName'), 'Green World')
```

#### - .pop

```js
edata_array.pop()
```

> pop and unwrap last element in wrapped array.

*return: **unwrapped data** in last array element*

```js
var root = edata()({ d: [{ v: 10 }] })
assert.deepStrictEqual(root.get('d').pop(), { v: 10 })
assert.deepStrictEqual(root.unwrap(), { d: [] })
```

## plugins

### `plugins/set-many`

Expose `setMany(object)` method to `set` multiple items, you can compare with React `setState` API.

config:

```js
import setMany from 'edata/plugins/set-many'
edata({
    plugins: [
        setMany
    ]
})
```

will expose:

#### - .setMany

```js
edata.setMany(kvMap: object, descriptors?: object)
```

> multiple set key and value from `kvMap`, and find descriptor from `descriptors` with the key.

*return: object with same key, and each value is result of set()*

```js
root.unwrap() // {a:10, x:20, y:30}
root.setMany({
    x:1,
    y:2
})
root.unwrap() // {a:10, x: 1, y:2}
```


### `plugins/actions`

If you want [CQRS](https://martinfowler.com/bliki/CQRS.html) style, like [Redux](https://github.com/reduxjs/redux) way, then this plugin exposes `.dispatch(action)` method, to send action to root to `set/unset` data, act as **Command in CQRS**.

config:

```js
import actions from 'edata/plugins/actions'
edata({
    plugins: [
        actions
    ]
})
```

will expose:

#### - .dispatch

```js
edata.dispatch(action: object)
```

> action is of shape: `{type, path, value}`, type can be `add/change/delete`, which will be converted to command `set/set/unset` accordingly.

**Notice**: this method will not emit `change` event on `root.observer`.

```js
root.unwrap() // {x:20, y:30}
root.dispatch({
    type: 'add',
    path: 'a.b',
    value: 'hey!'
})
root.unwrap() // {x:20, y:30, a: {b: 'hey!'}}
```

You may record `change` event of `root.observer` as a source of actions.

