# edata
Turn javascript data into extended EventEmitter.

An **edata** is an [EventEmitter](https://github.com/futurist/mitt) with `.value` (getter/setter), and helper methods to manipulate it.

[![Build Status](https://travis-ci.org/futurist/edata.svg?branch=master)](https://travis-ci.org/futurist/edata)
[![NPM Version](https://img.shields.io/npm/v/edata.svg)](https://www.npmjs.com/package/edata)

## Install

**NPM**
```sh
npm i -S edata
```

**Browser**
```html
<script src="https://unpkg.com/edata"></script>
<script>
    // edata is a global
    edata...
</script>
```


## Usage

### - **Initialize edata**

```js
import edata from 'edata'
const edataFactory = edata({})
// build edata root object
const root = edataFactory({
    age: 20,
    firstName: 'Hello',
    lastName: 'World',
    address: {
        city: 'Earth'
    }
})
```

root and everything inside is an edata (an EventEmitter with `.value`), so

#### edata = EventEmitter + '.value'

the `edata.value` is a getter/setter
```js
root.value.firstName.value  // get: firstName
root.value.firstName.value = 'name'  // set: firstName
```

you can use a shortcut:

```js
root.get('firstName')  // get: firstName
root.set('firstName', 'name')  // set: firstName
```

use `edata.on` to listen on `change` event for value changes
```js
root.value.firstName.on('change', e=>{
    console.log('First Name changed to: ' + e.data)
})

root.value.firstName.value = 'Hi'
//[console] First Name changed to: Hi
```

> Note: also exist `edata.map(callback)` as shortcut for `edata.on('change', callback)`

get an `edata` from path
```js
const city = root.get('address.city')
//instead of:
// const city = root.value.address.value.city
city.value = 'Earth'
```

every `edata` is an [EventEmitter](https://github.com/futurist/mitt), so
```js
root.get('address.city').on('change', e=>console.log('new value:', e.data))
root.set('address', {city: 'Mars'})  // set to address.city, same as above!

root.unwrap('address')  // flatten: {city: 'Earth'}
root.unset('address')   // delete root.address

root.unwrap() // flatten all: {age: 20, firstName: 'Hello', lastName: 'World'}
```

**Notice** all `edata object` has default `valueOf` function that returns `value`, so below are same:

```js
root.get('age').value + 10  // 30

// same as:
root.get('age') + 10  // 30
```

### - **Observe root changes**

The root `root` has a `observer` attribute, which is also an edata, you can callback for every changes.

**observe changes** of root
```js
const onDataChange = ({data, type, path})=>{
    console.log('value mutated:', path, type, data.unwrap())
}
root.observer.on('change', onDataChange)
// root.observer.map(onDataChange)
```

```js
root.set('address.city', 'Mars')
// [console] data mutated: [ 'address', 'city' ] add Mars
root.get('address.city').value = 'Earth'
// [console] data mutated: [ 'address', 'city' ] change Earth
root.unset('address.city')
// [console] data mutated: [ 'address', 'city' ] delete Earth
```

to stop, you can `.off` the event any time!
```js
root.observer.off('change', onDataChange)
```

### - **Define Data Relations**

You can define data relations using `setComputed`, as below:

```js
const root = edata()({
  firstName: 'Hello',
  lastName: 'World'
})
root.setComputed(
  'fullName',
  ['firstName', 'lastName'],
  ([firstName, lastName]) => firstName.value + ' ' + lastName.value
)
assert.equal(root.unwrap('fullName'), 'Hello World')
root.set('firstName', 'Green')
assert.equal(root.unwrap('fullName'), 'Green World')
```

### - **Use in React**

```js
const root = edata()({user: {name: 'earth'}})

class App extends React.Component {
    constructor(props){
        super(props)
        const {model} = this.props
        this.state = model.unwrap()
        // init: {name: 'earth'}
        
        this.onInputChange = e => {
            const {name, value} = e.target
            model.set(name, value)
        }
        
        this.onModelChange = ({data, type, path})=>{
            this.setState({
                [path]: data.value
            })
        }
    }

    componentDidMount(){
        model.observer.map(this.onModelChange)
    }
  
    componentWillUnmount(){
        model.observer.map(this.onModelChange)
    }
    
    render(){
        const {model} = this.props
        const userName = model.unwrap('name')
        return <div>
            <h3>Hello {userName}</h3>
            <input name='name' value={userName} onChange={this.onInputChange} />
        </div>
    }
}

ReactDOM.render(<App model={root.slice('user')} />, app)

```

You can play with the [demo here](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvAHgBMIA3AAgjYF4AOiAwAHUcIB8LAPQdOkkAF8K6bLkQEAVgip0GTYnn1xi3LLTYwo3ftxhsMxDPitgMAVyjEAFAEofYA84GAAnRG5gTBwIgHIYDFDiQlilJT9BNEzqKAw4OG4AQXF7AA9GNDYCgCUE6mJ8AGFaLFF6Q0jM7m7uE2JQj3raUJ9RUNpROD9gLp65uA9RMNHxyYy0Obm+yIsrKCVbbmSIOHwxibhZzaPCE-xTJxhD3et8DzQAd1CxfyvNmRkkWiMDiCSSKSUfzmUJ6x1O9AAkmhRB5iI1CBg0ABzJ52XGSToba6bbZRdQUbicDBQDwwA54-DOUI44gw64vKD3GC+YEUqk0mDrYncSFE65sm53egAWUs1nRmJxh0CjmcFOIAE8lhTRE5COl+JIZmLhZLTiFiABlZyMQIS4XIXXJAC6EVVLn5tPtPXSEtFc1FfzorXaDAAInxZe9fNMJRz8NQMdiYPh6D5Yu7YurbvC0LK9grk0KfbMgy02mhDAB1aBQACqaAs0f8xuF8cTipTtDAYHTmezUrzcqghZxxe6-p6f1CTCsI1jJq29FMO2H9LNZ1Wl0XPW2wTCADl1M9h29Pt9ROngbFx5sZ8QPKENuwuJJvd0WIQAMySAAS1igWhIn3UIjxwJRZG-N8d2uFgIGRVFuGBfhYmvSlqVpfgghCUD1AOehRxgLC4VTNAkRRNEkxxA4ZGg4VZHkOiSzQQM0FqDB6jDAB5aV8BnSplhYYpRHMYcsPjOAoAgagYHTECbxoyQKTEUR1koGhy2gMI8AAIwwHTrHUkJYHqCBlzwABGRAAAZlFUEBgTwBN8nU-QKiMTRlGdKgpLQABrBAUDUHA8BnDiGisThrAmHAGHwHR1MfchNBIYhJkQAF3lEPysQTFoZDC+oZA8LA2AKuoIpgKLANEWKGgSqhNSWPA4GoUIIFEIwVGCjQQEK4gAFo2BaVwqui2rDHi3QQCSvBUvSzLkRyvKsHK8Khvykqyv6jasFG6qYsmhqQCa3rWvazq7J6vAHCcDBEtCZKQHmuAMuKpbcuDGRbucAABaz8As-AvzkE5iGK0qpvU06WrajqjCoYyYFM8zNC-RALIATgG9GACYABYvKUIA)


## API

#### - import edata, {DefaultClass} from 'edata'
> The lib expose a default `edata` function to use

The `DefaultClass` can be used for sub-class your own implemention of `edata`.

You can `extends` this class to add your own methods:

```js
class MyedataClass extends DefaultClass {
    added_method(){
        // do sth.
    }
}
```

**Notice**

Be careful when using above `class` keyword, by default, you have to transpile your code to `ES5` to run correctly.

If you need to use `class` without transpile, you should import `edata/dist/node`, or `edata/dist/es`, the different between the two is the es using module as exports.

#### - edataFactory = edata(options)
> the `edataFactory` is used to turn data into *wrapped_edata*.

A `wrapped_edata` is an `edata` with some helper methods, like `get`, `set` etc., so

```
wrapped_edata = EventEmitter + '.value' + '.get' + '.set' ...
```

`options` has below options:
- **WrapClass**: Default implementation is [here](https://github.com/futurist/edata/blob/2e2c73b2d8aefaca61b4bc38b920c449c3f747ad/src/index.js#L556)
- **unwrapConfig**: when `unwrap`, you can add default config
- **plugins**: You can add your own API with this option

*return: function(data) -> wrapped_edata*

```js
import edata, {DefaultClass} from 'edata'
class MyedataClass extends DefaultClass {
    map(fn) {
        this.on('change', fn)
        return () => this.off('change', fn)
    }
}
var edataFactory = edata({
    WrapClass: MyedataClass
})
const root1 = edataFactory(data1)
const root2 = edataFactory(data2)
root1.map(onChangeHandler)
...
```

#### - root = edataFactory(data: any)
> the above code example, `root` is a *wrapped_edata*, with all nested data wrapped.

*return: wrapped_edata*

`root.observer` is also an edata object, you can listen to `change` event for children changes.

Any data inside root is a `wrapped_edata`, and may be contained by `{}` or `[]` edata object, keep the same structure as before.

Any `wrapped_edata` have `root` and `path` propperties, `get`, `set`, ... helper functions.


```js
var root = edataFactory({x: {y: {z: 1}}})
root.some_api...
```

#### - wrapped_edata.get(path: string|string[])
> get nested wrapped data from path, path is array of string or dot(`"."`) seperated string.

*return: wrapped_edata at `path`*

```js
var z = root.get('x.y.z')
// or
var z = root.get(['x','y','z'])
z.value // 2
z.value = 10
```

#### - wrapped_edata.slice(path: string|string[], filter?: ({data, type, path}):boolean, from = root)
> get nested wrapped data from path, and attach a `observer` edata object to observe scope mutations that the `root.path` starts with path.

*return: `wrapped_edata`, which have a `.observer` edata object*

The `wrapped_edata.observer` edata object's value has `path` property to reflect the sub path of the sliced data.

```js
var xy = root.slice('x.y')
xy.observer.on('change', ({data, type, path})=>console.log(type, path))
xy.set('z', 1)
// x.y changed! ['z']
```

#### - wrapped_edata.context(path: string|string[])
> Roughly the opposite to `slice`, `context` find `root model` from closest parent, with matching path using `RegExp`.

Passing `""` will return `root model`.

*return: `wrapped_edata` or `undefined` if not find*

```js
var xy = root.get('x.y')
var x = xy.context('x')  // get closest x
```

#### - wrapped_edata.set(path?: string|string[], value?: any, descriptor?: object)
> set nested wrapped data value from path, same rule as `get` method. The `descriptor` only applied when path not exists.

*return: wrapped_edata for `value`, at `path`*

`path` can contain `a.[3]` alike string denote `3` is an array element of `a`.

`value` can be any data types, if `path` is omitted, set value into wrapped_edata itself.

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

#### - wrapped_edata.getset(path?: string|string[], function(prevValue:wrappedData|any, empty?: boolean)->newValue, descriptor: object)
> like `set`, but value is from a function, it let you set `value` based on previous value, the `descriptor` only applied when `empty` is `true`.

*return: wrapped_edata for `newValue`, at `path`*

```js
// x.a = 10
var z = root.getset('x.a', val=>val + 1)
z.value  // 11
```

#### - wrapped_edata.unset(path: string|string[])
> delete `wrapped_edata` or `value` in `path`

*return: deleted data been **unwrapped***

```js
var z = root.unset('x.b')
z // 5
```

#### - wrapped_edata.unwrap(path?: string|string[], config?: {json: true})
> unwrap data and nested data while keep data structure, any level of `wrapper` on any data will be stripped.

If set `config` arg with `{json: true}`, then any circular referenced data will be set `undefined`, suitable for `JSON.stringify`.

If set `config` arg with `{map: value=>...}`, then the final value is first mapped, then returned, and the return value of `unwrapConfig` will be merged into this config.

*return: unwrapped data*

```js
var z = root.unwrap()

z // {x: {y: {z: 11}}, a: [10]},   x.c is hidden
```

#### - wrapped_array.push(value: any)
> push new `value` into wrapped data when it's array, all the inside will be wrapped.

*return: newly pushed wrapped_edata*

```js
var z = root.set('d', [])
z.push({v: 10})
z.get('d.0.v').value  // 10
```

#### - wrapped_array.pop()
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

#### - wrapped_edata.setMany(kvMap: object, descriptors?: object)
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

Expose `dispatch(action)` method, to send action to root to `set/unset` data, like [Redux](https://github.com/reduxjs/redux) way.

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

#### - wrapped_edata.dispatch(action: object)
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
