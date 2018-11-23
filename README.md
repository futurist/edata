# rdata
Turn data into reactive rdata.

A rdata object is an [EventEmitter](https://nodejs.org/api/events.html), plus a value attribute (getter/setter), and helpers like unwrap, get, set, unset etc.

[![Build Status](https://travis-ci.org/futurist/rdata.svg?branch=master)](https://travis-ci.org/futurist/rdata)
[![NPM Version](https://img.shields.io/npm/v/rdata.svg)](https://www.npmjs.com/package/rdata) [![Join the chat at https://gitter.im/rdata/Lobby](https://badges.gitter.im/rdata/Lobby.svg)](https://gitter.im/rdata/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Install

**NPM**
```sh
npm i -S rdata
```

**Browser**
```html
<script src="https://unpkg.com/rdata"></script>
<script>
    // rdata is a global
    rdata(...)
</script>
```


## Usage

### - **Convert existing data and use wrapped data**

```js
import rdata from 'rdata'
const rdataFactory = rdata({})
const data = {
    age: 20,
    firstName: 'Hello',
    lastName: 'World',
    address: {
        city: 'Earth'
    }
}
const model = rdataFactory(data)
// model and everything inside is a rdata(getter/setter + EventEmitter!)

// rdata.value is a getter/setter
model.value.firstName.value  // get Hello

// rdata.map can have callback
model.value.firstName.on('data', newVal=>{
    console.log('First Name changed to: ' + newVal)
})

model.value.firstName.value = 'Hi' // set to Hi
// [console] First Name changed to: Hi

// every rdata is EventEmitter, so
model.value.address.value.city.on('data', newVal=>console.log('new value:', newVal))
// for long path, use helper method: .set
model.value.address.value.city.value = 'Mars'  // set 'Mars'
model.set('address', {city: 'Mars'})  // set to address.city, same as above!

// get a rdata from path
const city = model.get('address.city')  // Mars
city.value  // get 'Mars'
city.value = 'Earth'  // set 'Earth'

model.unwrap('address')  // flatten: {city: 'Earth'}
model.unset('address')   // delete model.address

model.unwrap() // flatten all: {age: 20, firstName: 'Hello', lastName: 'World'}

```

**Notice** all `rdata object` has default `valueOf` function that returns `value`, so below are same:

```js
model.get('age').value + 10  // 30

// same as:
model.get('age') + 10  // 30
```

### - **Observe model changes**

The root `model` has a `change` rdata, you can callback for every data changes.

```js
// start observe model changes
model.change.on('data', ({value, type, path})=>{
    console.log('data mutated:', path, type, value.unwrap())
})
// you can .off the event any time!

model.set('address.city', 'Mars')
// [console] data mutated: [ 'address', 'city' ] add Mars
model.get('address.city')('Earth')
// [console] data mutated: [ 'address', 'city' ] change Earth
model.unset('address.city')
// [console] data mutated: [ 'address', 'city' ] delete Earth
```

### - **Define data relations**

You can define data relations using `setComputed`, as below:

```js
const firstName = model.get('firstName')
const lastName = model.get('lastName')
model.setComputed(
    'fullName',
    ['firstName', 'lastName'],
    (firstName, lastName) => firstName + ' ' + lastName
)
model.get('fullName').on('data', val => console.log(val))
firstName.value = 'Green'
// [console] Green World

model.unwrap()
// {firstName:'Green', lastName:'World', fullName:'Green World'}
```

### - **Use in React**

```js
const model = rdata()({user: {name: 'earth'}})

class App extends React.Component {
    constructor(props){
        super(props)
        const {model} = this.props
        this.state = model.unwrap()
        // {name: 'earth'}
        
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
        model.change.on('data', this.onModelChange)
    }
  
    componentWillUnmount(){
        model.change.off('data', this.onModelChange)
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

ReactDOM.render(<App model={model.slice('user')} />, app)

```

You can play with the [demo here](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvAHgBMIA3AAgjYF4AOiAwAHUcIB8LAPQdOkkAF8K6bLkQEAVgip0GTYnn1xi3LLTYwo3ftwBObDMQwAKAJSvgAVzgx7iNzAmDiBAOQwGPbEhGFKSu6CaEnUUBhwcNwAguLcMAAejGhsmQBKkdTE+ADCtFii9IZBSdyt3CbE9t6VtPauova0onDuwC1tE3Deov79g8OJaBMTHUEWVlBKttwxEHD4A0Nw48s7hHv4ps4w2+vW+N5oAO72Yh4nyzIyQSEw4ZHRWJKD4TEFtXb7egASTQom8xGqhAwaAA5jc7OjJM0lqdlqtguoKNxOBgoN4YFsMfgXPY0cQwac7lBLjBiK5fkSSWSYItcdxgTjTgyzhd6ABZSzWRHItHbLxOFxE4gATxmRNEzkICX4kjGgr5Iv2fmIAGUXIwvMK+cgNTEALqBBUYfBc8lWtoJYUCiYCj50eqNBgAET4EsebNGwqZ+GoSNRMHw9FcYSdYSV50haAlG2l8d5HvGfrqDTQhgA6tAoABVNAWcMePV86OxmUJ2hgMDJ1Pp0VZyVQXNo-Otb1tD72JhWPqR-UreimNb9ymGg7zY6ztqrXz+ABy6lu-Yez1eomTvzCw+WE+I3nsS3YXEk7taLEIAGZJAAJaxQWhBbf2HuOBKLI75PhupwsBAsLwtwvz8GE57EqS5L8D4fiAeoWz0IOMBoRCiZoDCcIInGaJbDI4F8rI8hUQWaC+mg5QYJUQYAPJivgE7FLMLA5KI5j9mh0ZwFAEDUDAyYAReFGSESYiiIslA0MW0D+HgABGGAadYyl+LAlQQPOeAAIwAOyICZAAsyiqCAvx4DGGTKfoRRGJoyh2lQYloAA1ggKBqDgeATixVRWJw1hDDgDD4Doym3uQmgkMQwyIF8jyiL5KIxnUMihZUMjeFgbD5RU4UwJFv6iDFVTxVQKozHgcDUPYECiEYKhBRoIAFcQAC0bB1PgEVRTVhhxboICJXgKVpRlsLZblWBlWFg15cVpV9etWAjZVY21ZNymNT1LVtR1tndSFToJfYSUgHNcDpUVi05f6+VOgAAgADPgJn4N9ch7MQRUlUdDWqqdrXtZ1dpKEAA)


## API

#### - rdata = require('rdata')
> The lib expose a default `rdata` function to use

#### - rdataFactory = rdata(options)
> the `rdataFactory` is used to turn data into *wrapped_rdata*.

A `wrapped_rdata` is just a [EventEmitter](https://nodejs.org/api/events.html) + value attribute (getter/setter), with some helper methods added to it, like `get`, `set` etc.

`options` has below options:
- **WrapClass**: Default implementation is [here](https://github.com/futurist/rdata/blob/2e2c73b2d8aefaca61b4bc38b920c449c3f747ad/src/index.js#L556)
- **unwrapConfig**: when `unwrap`, you can add default config
- **addMethods**: You can add your own API with this option

*return: function(data) -> wrapped_rdata*

```js
class MyWrapClass extends rdata.DefaultClass {
    map(fn) {
        this.on('data', fn)
        return () => this.off('data', fn)
    }
}
var rdataFactory = rdata({
    WrapClass: MyWrapClass
})
rdataFactory(data1).map(...)
rdataFactory(data2).map(...)
...
```

#### - root = rdataFactory(data: any)
> the `root` is a *wrapped_rdata*, with all nested data wrapped.

*return: wrapped_rdata for `data`*

`root.change` is also a rdata object, you can listen to `data` event for children changes.

Any data inside root is a `wrapped_rdata`, and may be contained by `{}` or `[]` rdata object, keep the same structure as before.

Any `wrapped_rdata` have `root` and `path` propperties, `get`, `set`, ... helper functions.


```js
var root = rdataFactory({x: {y: {z: 1}}})
root.some_api...
```

#### - wrapped_rdata.get(path: string|string[])
> get nested wrapped data from path, path is array of string or dot(`"."`) seperated string.

*return: wrapped_rdata at `path`*

```js
var z = root.get('x.y.z')
// or
var z = root.get(['x','y','z'])
z.value // 2
z.value = 10
```

#### - wrapped_rdata.slice(path: string|string[], filter?: ({data, type, path}):boolean, from = root)
> get nested wrapped data from path, and attach a `change` rdata object to it that filtered from `(from||root).change` rdata object, the default filter is to test if the `root.path` starts with path.

*return: `wrapped_rdata`, which have a `.change` rdata object*

The `wrapped_rdata.change` rdata object's value has `path` property to reflect the sub path of the sliced data.

```js
var xy = root.slice('x.y')
xy.change.map(({data, type, path})=>console.log(type, path))
xy.set('z', 1)
// x.y changed! ['z']
```

#### - wrapped_rdata.context(path: string|string[])
> Roughly the opposite to `slice`, `context` find model from closest parent, with matching path using `RegExp`.

Passing `""` will return `root model`.

*return: `wrapped_rdata` or `undefined` if not find*

```js
var xy = root.get('x.y')
var x = xy.context('x')  // get closest x
```

#### - wrapped_rdata.set(path?: string|string[], value?: any, descriptor?: object)
> set nested wrapped data value from path, same rule as `get` method. The `descriptor` only applied when path not exists.

*return: wrapped_rdata for `value`, at `path`*

`path` can contain `a.[3]` alike string denote `3` is an array element of `a`.

`value` can be any data types, if `path` is omitted, set value into wrapped_rdata itself.

If `value` is a **rdata object**, then it's an **atom data**, which will not be wrapped inside.

`descriptor` is optional, same as 3rd argument of `Object.defineProperty`, this can e.g. create non-enumerable rdata object which will be hidden when `unwrap`.

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

#### - wrapped_rdata.getset(path?: string|string[], function(prevValue:wrappedData|any, empty?: boolean)->newValue, descriptor: object)
> like `set`, but value is from a function, it let you set `value` based on previous value, the `descriptor` only applied when `empty` is `true`.

*return: wrapped_rdata for `newValue`, at `path`*

```js
// x.a = 10
var z = root.getset('x.a', val=>val + 1)
z.value  // 11
```

#### - wrapped_rdata.ensure(invalid?: (val:wrapped):boolean, path: string|string[], value?: any, descriptor?: object)
> like `set`, but only `set` when the path **not exists** or `invalid` test true for the path, otherwise perform a `get` operation.

The `invalid` test more like a **set then get** when specified.

*return: wrapped_rdata at `path`*

```js
var z = root.ensure('x.a', 5)
// x.a exists, so perform a get, `5` ignored
z.value  // 11

var z = root.ensure('x.b', 5)
// x.b not exists, so perform a `set`
z.value  // 5

// ensure `a.b` always >= 10
root.ensure(val=>val<10, 'x.b', 10).unwrap() //10
```

#### - wrapped_rdata.unset(path: string|string[])
> delete `wrapped_rdata` or `value` in `path`

*return: deleted data been **unwrapped***

```js
var z = root.unset('x.b')
z // 5
```

#### - wrapped_rdata.unwrap(path?: string|string[], config?: {json: true})
> unwrap data and nested data while keep data structure, any level of `wrapper` on any data will be stripped.

If set `config` arg with `{json: true}`, then any circular referenced data will be set `undefined`, suitable for `JSON.stringify`.

If set `config` arg with `{map: value=>...}`, then the final value is first mapped, then returned, and the return value of `unwrapConfig` will be merged into this config.

*return: unwrapped data*

```js
var z = root.unwrap()

z // {x: {y: {z: 11}}, a: [10]},   x.c is hidden
```

#### - wrapped_rdata.setMany(kvMap: object, descriptors?: object)
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

#### - wrapped_rdata.getMany(pathMap: object|string[]|string, mapFunc?:(val: IWrappedData|undefined)=>any)
> multiple get each path from `pathMap`(can be array/object/string), and map each value with `mapFunc` as result.

*return: result data with same shape as pathMap*

```js
root.unwrap() // {a:10, x:20, y:30}
root.getMany(['x', 'y'])  // [20, 30]
```

#### - wrapped_array.push(value: any)
> push new `value` into wrapped data when it's array, all the inside will be wrapped.

*return: newly pushed wrapped_rdata*

```js
var z = root.set('d', [])
z.push({v: 10})
z.get('d.0.v').value  // 10
```

#### - wrapped_array.pop()
> pop and unwrap last element in wrapped array.

*return: **unwrapped data** in last array element*

```js
var z = root.ensure('d', [])
z.get('d').pop()  // {v: 10}
```

