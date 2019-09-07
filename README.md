# EDATA (Enhanced DATA)

**edata** is the nested observable reactive [EventEmitter](https://github.com/futurist/mitt) with `.value` getter/setter, lodash style path, and keep [Observer Pattern](https://en.wikipedia.org/wiki/Observer_pattern) in mind.

It roughly referenced [Object.observe API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe), but instead using [getter/setter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects#Defining_getters_and_setters) to wrap object, lightweight than [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

[![Build Status](https://travis-ci.org/futurist/edata.svg?branch=master)](https://travis-ci.org/futurist/edata)
[![NPM Version](https://img.shields.io/npm/v/edata.svg)](https://www.npmjs.com/package/edata)

<!-- toc -->

- [Install](#install)
- [Usage](#usage)
  * [- Quick Start](#--quick-start)
  * [- Watch changes](#--watch-changes)
  * [- Define Data Relations](#--define-data-relations)
  * [- Flat data](#--flat-data)
  * [- Use in React](#--use-in-react)
- [API](#api)

<!-- tocstop -->

## Install

**NPM**
```sh
npm install --save edata
```

```js
import edata from 'edata'
```

## Usage

### - Quick Start


**Below can give you a quick idea of edata:**

```js
var root = edata({a: {b: {c: {}}}})
// plain_object ---> edata
```

<img src="assets/edata.png" width="640">

**Complete example:**

```js
import edata from 'edata'
const root = edata({
    age: 20,
    firstName: 'Hello',
    lastName: 'World',
    address: {
        city: 'Earth'
    }
})
const callback = ({type, path}) => console.log(`--> ${type}: ${path}`)
root.watch(callback)
root.set('address.city', 'Moon') // LOG: --> update: ['address', 'city']
root.get('address.city').value // Moon
```

**Plain object wrapped into edata:**

> edata = new EventEmitter(object)

so use `edata.on` can watch changes, use `edata.value`(getter/setter) to get nested edata.

```js
root.value.firstName.value  // get -> firstName
root.value.firstName.value = 'name'  // set -> firstName
root.value.address.value.city.on('change', callback)  // watch on 'change'
```

**Can also use lodash style:**

```js
root.get('firstName').value  // get: firstName
root.set('firstName', 'name')  // set: firstName
root.get('address.city').on('change', ...) // watch change
```

**Proxy usage:**

use `.proxy()` to shorten the path:

```js
const data = root.proxy()
data.address.city // Moon
data.__edata__  // get back the `root` edata
```

### - Watch changes

Any edata can `watch` data changes inside(any level):

```js
const onDataChange = ({data, type, path})=>{
    console.log('value mutated:', path, type, data.unwrap())
}
const unwatch = root.watch('change', onDataChange)

root.set('address.city', 'Mars')
// [LOG] data mutated: [ 'address', 'city' ] add Mars
unwatch() // stop watch
root.get('address.city').value = 'Earth'
// nothing outout
```

**Watch single data `change` event:**

```js
root.get('firstName').on('change', ({path, type, data})=>{
    console.log(path, type, 'to: ' + data)
})
root.set('firstName', 'Hi')
//[LOG] firstName update to: Hi
```

> Note: `edata.on('change', callback)` has shortcut: `edata.map(callback)`


### - Define Data Relations

You can define data relations using `setComputed`, as below:

```js
const root = edata({
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

### - Flat data

Since the edata objects nested as **EventEmitter**, you can flat this structure into plain object using `edata.unwrap()`:

```js
root.unwrap()
// flat root: {age: 20, firstName: 'Hello', lastName: 'World', address: {city: 'Earth'}}

root.unwrap('address')
// flat address: {city: 'Earth'}

root.unset('address')
// delete address

root.unwrap()
// {age: 20, firstName: 'Hello', lastName: 'World'}
```

Also exist `edata.toJSON()`, so the `JSON.stringify(edata)` just like

```js
JSON.stringify(edata.unwrap({json:true}))
```

### - Use in React

The pros is you can use `edata.set()` instead of `this.setState`:

```js
import edata from 'edata'
const root = edata({user: {name: 'earth'}})

class App extends React.Component {
    constructor(props){
        super(props)
        const {model} = this.props
        this.state = model.unwrap()
        // state: {name: 'earth'}
        model.watch(()=>{
            this.setState(model.unwrap())
        })
    }
    
    render(){
        const {model} = this.props
        const name = model.unwrap('name')
        return <div>
            <h3>Name: {name}</h3>
            <input
              value={name}
              onChange={e=>{model.set('name', e.target.value)}}
            />
        </div>
    }
}

ReactDOM.render(<App edata={root.cut('user')} />, app)
```

You can play with the [demo here](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvAHgBMIA3AAgjYF4AOiAwAHUcIB8LAPQdOkkAF8K6bLkQEAVgip0GTYnghZRtAE7FuMNhmIZuYc7SzcA5DbsY3gtPrhWzrRW-Na29gAUAJQRwACucDDmiNzAmDgpHhiWhG5KSlG+vtRQGHBw3ACC4tYAHoxobBUASjAY1MT4AMIuZmiGqb7cw9z+xOZxHRYRos6icFHAQyMrcHGiSTNzC8srw2OpnvZK3KHEhBBw+LO087t755f4AXYwp2Fe+HFoAO7mYtF7isZDJuC9GCk0upMm0cnkgSNHlcArd3kcMPhaAAjRLmThJfBYAHRfiSJZoPaU7hI54wYgAZXsjAi6K+v3+omihQpVIK9yU93u5iYbE2iwR+3oAUO4QwJzOFyuNzuPMpB3Sb1CrO+fwBbg1bm5VO4wuIcXMFPYXEkEr2LEIAGZJAA5aGpDVKWSOm2q43cFgQNCiOLEW2UzgYKBxGD8KE4AW+v3cehdQgYNAAcxjwBjZNZiWIEX16jcFGs+Hs5iznQjUZgUXyYZGMh9xtk8lbIwTCd8rXaxAAIgB5ACy+GFjU2LGqog+9ljQU6cCgEGoMCLCSShpOLbLYlEUUoNF60CSeCxGCxMHIVESsA6ECleAAjAAWRDPh3KVQgDV4fDUOUR76A0RiaMoAC6VArmgADWCAoGoOB4MK-b4KK+JQLcOAMPgOhHua5CaCQxDzIgILfKIsEZgBLgyKhHQyHEWBsPRbQdOhMCYdhhh4boIDEAAnhseBwNQ5gQKIRgqEhGggAxxAALRsC4nHcaIOGdPhVCEXgJFkRRQbUbRWBsf2yl0cxrEKRZWBqdePG4dpAnCXJYkSVJkFKEAA)

## API

See [API Document](https://github.com/futurist/edata/blob/master/api.md)

