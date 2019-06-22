/* eslint-disable no-unused-vars */
'use strict'

let path = require('path')
let it = require('ospec')
let { default: edata, EdataBaseClass } = require('../dist/node')
let { keys } = Object
function isWrapper (s) { return s instanceof EdataBaseClass }

function ensureArrayPath (d) {
  d.value.forEach((v, i) => {
    it(d.get(i).path.pop()).deepEquals(i)
  })
}

class TestBaseClass extends EdataBaseClass {
  // map (fn) {
  //   this.on('change', fn)
  //   return () => {
  //     this.removeListener('change', fn)
  //   }
  // }
}

/* eslint no-redeclare: 0 */
it('basic', () => {
  var d = edata({ a: 1, b: { c: 2 } }, {
    baseClass: TestBaseClass
  })
  it(isWrapper(d)).equals(true)
  // event
  d.value.a.on('change', e => {
    it(e).deepEquals({ data: 10, oldData: 1 })
  })
  d.value.a.value = 10
  it(keys(d.value)).deepEquals(['a', 'b'])
  it(keys(d.value.b.value)).deepEquals(['c'])
  it(isWrapper(d.value.b)).equals(true)
  it(d.value.a.value).equals(10)
  it(typeof d.value.b.value).equals('object')
  it(d.value.b.value.c.value).equals(2)
  it(Object.keys(d.set({ b: 1 }).value)).deepEquals(['b'])
  // root set
  it(d.set({ b: 1 }).unwrap()).deepEquals({ b: 1 })
  var x = d.of({ a: 1 })
  it(isWrapper(x)).equals(true)
})

it('root test', () => {
  var d = edata({ a: 1, b: { c: 2 } }, {
    baseClass: TestBaseClass
  })
  it(d.root).equals(d)
  it(d.value.b.value.c.root).equals(d)
})

it('unset null test', () => {
  var d = edata({ a: 1, b: { c: 2 } })
  it(d.get('b').unset()).deepEquals({ c: 2 })
  it(d.unwrap()).deepEquals({ a: 1 })
})

it('path as array test', () => {
  var d = edata({ a: 1, b: { c: 2 } })
  it(d.get(['b', 'c']).unwrap()).deepEquals(2)
  d.set(['xx', 'yy', 0], { z: 1 })
  it(d.get('xx').unwrap()).deepEquals({
    yy: [{ z: 1 }]
  })
})

it('root unwrap', () => {
  var data = { a: { b: { c: 2 } } }
  data.a.b.x = data.a
  var d = edata(data, {
    baseClass: TestBaseClass
  })
  it(d.unwrap('a.b', { json: true })).deepEquals({ c: 2, x: {} })
  it(d.unwrap('a.b.c')).deepEquals(2)
  it(d.unwrap('a.b.c.d')).deepEquals(undefined)

  it(d.get('a').unwrap('b.c')).deepEquals(2)
})

it('not dive into stream', () => {
  var d = edata({
    a: 1,
    b: new TestBaseClass({
      x: 2, y: 3
    })
  }, {
    baseClass: TestBaseClass
  })

  it(d.value.b.value.value).deepEquals({
    x: 2,
    y: 3
  })
})

it('array test', () => {
  var spy = it.spy()
  var x = edata({ a: { b: [] } }, {
    baseClass: TestBaseClass
  })
  // x.value.a.value = (x.value.a.value) // give it a change first to test map
  x.observer.map(spy)

  var b = x.value.a.value.b
  b.value = ([])
  it(spy.callCount).equals(1)

  b.set(0, { x: 1 })
  it(spy.callCount).equals(2)
  it(b.value[0].value.x.path.join()).equals('a,b,0,x')

  var val = b.get(b.push({ x: 2 }) - 1)
  it(spy.callCount).equals(3)
  it(val.path.join()).equals('a,b,1')
  it(val.value.x.value).deepEquals(2)
  it(b.value.length).equals(2)

  var val = b.pop()
  it(spy.callCount).equals(4)
  it(val).deepEquals({ x: 2 })
  it(b.value.length).equals(1)

  var val = b.pop()
  it(spy.callCount).equals(5)
  it(val).deepEquals({ x: 1 })
  it(b.value.length).equals(0)

  var val = x.set('c.[0].xx', 10)
  it(spy.callCount).equals(8)

  var val = x.set('y.[0]', 10)
  it(val.value).equals(10)
  it(val.path.join()).equals('y,0')
  it(spy.callCount).equals(10)

  it(x.unwrap()).deepEquals({ a: { b: [] }, c: [ { xx: 10 } ], y: [10] })

  // array unwrap, mutate and reset
  var c = x.get('c')
  var _c = c.unwrap()
  _c.unshift({ yy: 2 })
  c.set(_c)
  it(spy.callCount).equals(11)
  it(x.unwrap()).deepEquals({ a: { b: [] }, c: [ { yy: 2 }, { xx: 10 } ], y: [10] })
  it(x.get('c').shift()).deepEquals({ yy: 2 })
  it(spy.callCount).equals(12)
  it(x.get('c.0').path).deepEquals(['c', 0])
  it(x.get('c').unshift(10)).equals(2)
  it(spy.callCount).equals(13)
  it(x.get('c.1').unwrap()).deepEquals({ xx: 10 })
  it(x.get('c.1').path).deepEquals(['c', 1])
})

it('array methods test', () => {
  var spy = it.spy()
  var spyRoot = it.spy()
  var root = edata({ d: [{ v: { y: 10 } }] })
  root.observer.map(spyRoot)
  var s = root.cut('d.0')
  s.observer.map(spy)
  const d = root.get('d')
  it(d.cut()).equals(d)
  it(isWrapper(d.cut().observer)).equals(true)
  it(d.pop()).deepEquals({ v: { y: 10 } })
  it(spy.callCount).equals(1)
  it(spy.args[0].type).equals('delete')
  it(root.unwrap()).deepEquals({ d: [] })

  it(d.splice(0, 0, { x: 2 }, { x: 1 }, { x: 3 })).deepEquals([])
  it(spyRoot.callCount).equals(4)
  ensureArrayPath(d)

  it(d.splice(1, 1, { x: 4 }, { x: 5 })).deepEquals([{ x: 1 }])
  it(spyRoot.callCount).equals(7)
  ensureArrayPath(d)
  it(d.unwrap()).deepEquals([{ x: 2 }, { x: 4 }, { x: 5 }, { x: 3 }])

  d.sort((a, b) => { return a.unwrap('x') - b.unwrap('x') })
  it(spyRoot.callCount).equals(11)
  ensureArrayPath(d)
  it(d.unwrap()).deepEquals([{ x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }])
  ensureArrayPath(d)

  d.fill({ x: 10 }, 2)
  it(spyRoot.callCount).equals(13)
  ensureArrayPath(d)
  it(d.unwrap()).deepEquals([{ x: 2 }, { x: 3 }, { x: 10 }, { x: 10 }])

  d.reverse()
  it(spyRoot.callCount).equals(17)
  ensureArrayPath(d)
  it(d.unwrap()).deepEquals([{ x: 10 }, { x: 10 }, { x: 3 }, { x: 2 }])

  d.copyWithin(0, 2)
  it(spyRoot.callCount).equals(19)
  ensureArrayPath(d)
  it(d.unwrap()).deepEquals([{ x: 3 }, { x: 2 }, { x: 3 }, { x: 2 }])
})

it('single unwrap', () => {
  var spy = it.spy()
  var x = edata({ a: { b: new TestBaseClass(10) } }, {
    baseClass: TestBaseClass
  })
  x.observer.map(spy)
  it(x.value.a.unwrap()).deepEquals({ b: 10 })
})

it('set test', () => {
  var spy = it.spy()
  var d = edata({}, {
    baseClass: TestBaseClass
  })
  d.observer.map(spy)
  it(spy.callCount).equals(0)
  d.set('x.y.z', 10)
  it(spy.callCount).equals(3)
})

it('object test', () => {
  var xa = {
    i: new TestBaseClass(new TestBaseClass(99)),
    b: 1,
    v: 10,
    y: [3, 4, 5, 6]
  }
  var xd = { d: 3 }
  xa.c = xd

  var x = {
    a: xa
  }

  var spy = it.spy()
  var d = edata(x, {
    baseClass: TestBaseClass
  })
  d.observer.map(spy)
  it(spy.callCount).equals(0)

  it(d.unwrap()).deepEquals({
    a: {
      i: 99,
      b: 1,
      v: 10,
      y: [3, 4, 5, 6],
      c: {
        d: 3
      }
    }
  })

  it(keys(d.value).join()).equals('a')
  it(keys(d.value.a.value).join()).equals('i,b,v,y,c')
  it(keys(d.value.a.value.c.value).join()).equals('d')
  it(d.value.a.value.i.value.value.value).equals(99)
  it(d.value.a.value.y.value.length).equals(4)
  it(isWrapper(d.value.a.value.y.value[0])).equals(true)
  it(d.value.a.value.y.value[0].value).equals(3)
  it(d.value.a.value.c.value.d.value).equals(3)

  it(d.get('a.c.d').path.join()).equals('a,c,d')
  it(d.get('a.c.d').value).equals(3)

  it(d.get('a.c.dddd')).equals(undefined)
  it(d.get('a.ccc.c')).equals(undefined)

  it(d.get('a').get('c').get('d').path.join()).equals('a,c,d')

  it(spy.callCount).equals(0)

  d.set('a.x.y', 34)
  it(spy.callCount).equals(2)
  it(spy.args[0].data.value).deepEquals(34)
  it(spy.args[0].data.path.join()).deepEquals('a,x,y')
  it(spy.args[0].type).equals('add') // 1: ADD

  d.set('a.x.f', new TestBaseClass(new TestBaseClass(35)))
  it(spy.callCount).equals(3)

  it(d.get('a.x.y').value).equals(34)
  it(d.get('a.x.f').value.value.value).equals(35)

  var ss = d.get('a.x.y', 234)
  it(spy.callCount).equals(3)
  // .get will not change for exits one
  it(ss.unwrap()).equals(34)

  // but set can
  d.set('a.x.y', 3)
  it(spy.callCount).equals(4)
  it(spy.args[0].type).equals('update') // 0: CHANGE
  it(ss.unwrap()).equals(3)

  try {
    var ss = d.set('a.v.z', 234)
  } catch (e) {
    // TypeError: Cannot create property 'z' on number '10'
    var err = e
  }
  it(err instanceof Error).equals(true)
  // failed, but still change
  it(spy.callCount).equals(4)

  // success setd set
  var xy = d.set('a.x.z', 234)
  it(spy.callCount).equals(5)
  it(xy.value).equals(234)

  d.set('a.x.y', 199)
  it(spy.callCount).equals(6)
  it(d.get('a.x').get('y').unwrap()).equals(199)

  d.unset('a.x.y')
  it(spy.callCount).equals(7)
  it(spy.args[0].data.path.join()).equals('a,x,y')
  it(spy.args[0].type).equals('delete')

  it(d.get('a.x.y')).equals(undefined)

  d.set('a.x.y', { xx: 2 })
  it(spy.callCount).equals(8)
  it(d.get('a.x.y.xx').path.join()).equals('a,x,y,xx')
  it(d.get('a.x.y.xx').value).equals(2)
  it(d.value.a.value.x.value.y.value.xx.value).equals(2)

  d.set('a.y.4', { yy: { zz: 234 } })
  it(spy.callCount).equals(9)
  it(d.get('a.y').value.length).equals(5)
  it(d.get('a.y.4.yy').path.join()).equals('a,y,4,yy')
  it(d.get('a.y.4.yy.zz').path.join()).equals('a,y,4,yy,zz')
  it(d.get('a.y.4.yy.zz').value).equals(234)

  d.unset('a.y.3')
  it(spy.callCount).equals(10)

  d.get('a.i').set(10)
  it(spy.callCount).equals(11)
  it(spy.args[0].type).equals('update')
  it(d.value.a.value.i.value).equals(10)
  it(d.value.a.value.i.path.join()).equals('a,i')

  var y = [ 3, 4, 5, null, { yy: { zz: 234 } } ]
  delete y[3]
  it(d.unwrap()).deepEquals({ a:
    { i: 10,
      b: 1,
      v: 10,
      y,
      c: { d: 3 },
      x: { f: 35, z: 234, y: { xx: 2 } } } })
})

it('circle object test', () => {
  var xa = {
    b: { d: 1 },
    y: [3, 4, 5]
  }
  xa.c = xa
  xa.y.push(xa.b)

  var x = {
    a: xa
  }
  xa.a = x

  var spy = it.spy()
  var d = edata(x, {
    baseClass: TestBaseClass
  })
  d.observer.map(spy)
  it(spy.callCount).equals(0)

  it(keys(d.value).join()).equals('a')
  it(keys(d.value.a.value).join()).equals('b,y,a,c')
  it((d.value.a.value.c.value.c.value.c.value.b.path).join()).equals('a,b')
  it(keys(d.value.a.value.c.value.c.value.c.value.b.value).join()).equals('d')
  it(d.value.a.value.y.value[3].value.d.path.join()).equals('a,b,d')
  it(keys(d.value.a.value.y.value[3].value).join()).equals('d')

  var r = (d.unwrap({ json: false }))
  it(r.a.c).equals(r.a)
  it(r.a.c).equals(r.a.c.c.c)
  it(r.a.y[3]).equals(r.a.b)

  // below recursive will be removed for json
  d.value.x = d.value.a

  var json = d.unwrap({ json: true })
  it(json).deepEquals({ a: { b: { d: 1 }, y: [ 3, 4, 5 ] } })
  // .toJSON test
  it(JSON.stringify(d)).deepEquals('{"a":{"b":{"d":1},"y":[3,4,5]}}')
})

it('getset', () => {
  var spy = it.spy()
  var d = edata({
    a: 1, b: { c: 2 }
  }, {
    baseClass: TestBaseClass
  })
  d.observer.map(spy)
  var r = d.getset('b.c', v => {
    return v.value + 1
  })
  it(spy.callCount).equals(1)
  it(r.unwrap()).equals(3)

  var r = d.getset('b.d', (v, empty) => {
    it(empty).equals(true)
    return { y: 3 }
  })
  it(spy.callCount).equals(2)
  it(r.path.join()).equals('b,d')
  it(r.unwrap()).deepEquals({ y: 3 })

  var x = d.get('b.c')
  var r = x.getset(v => v.value + 1)
  it(r.unwrap()).equals(4)
})

it('set descriptor', () => {
  var spy = it.spy()
  var d = edata({
    a: 1, b: { c: 2 }
  }, {
    baseClass: TestBaseClass
  })
  d.observer.map(spy)
  var r = d.set('b.x', 3, {})
  it(spy.callCount).equals(1)
  it(r.unwrap()).equals(3)

  // test set, then get
  d.set('b.x', 4)
  r = d.get('b.x')
  it(r.value).equals(4)

  d.set('b.y', 10, {})
  d.set('b.z', 10, { enumerable: true })

  d.get('a').set()

  it(d.unwrap()).deepEquals({
    a: undefined, b: { c: 2, z: 10 }
  })
})

it('model cut', () => {
  var spy = it.spy()
  var d = edata({
    a: 1, b: { c: 2 }
  }, {
    baseClass: TestBaseClass
  })
  var unmap1 = d.observer.map(spy)
  const values = [
    ['update', [ 'b', 'c' ]],
    ['update', ['a']],
    ['update', [ 'b', 'c' ]],
    ['create', ['x']],
    ['add', ['x', 'y']]
  ]
  var unmap2 = d.observer.map(({ data, type, path }) => {
    const [_type, _path] = values.shift()
    it(type).equals(_type)
    it(path).deepEquals(_path)
  })
  var bc = d.cut('b.c')
  var disposer = bc.observer.map(spy)
  d.cut('b').observer.map(({ data, path }) => {
    it(path).deepEquals(['c'])
  })
  d.set('b.c', 3)
  it(spy.callCount).equals(2)
  d.set('a', 2)
  it(spy.callCount).equals(3)
  // end bc.observer
  disposer()
  bc.value = (4)
  it(spy.callCount).equals(4)
  it(d.get('a').observer).equals(undefined)
  it(isWrapper(d.get('b').observer)).equals(true)

  // cut non-exist path
  it(d.cut('x.y').unwrap()).deepEquals({})
})

it('multiple cut', () => {
  var spy = it.spy()
  var d = edata({
    a: 1, b: { c: 2 }
  }, {
    baseClass: TestBaseClass
  })
  // null path test first
  var x = d.get('b').cut()
  var xo = x.observer
  var s1 = x.observer.map(spy)
  var y = d.cut('b')
  var yo = y.observer
  var s2 = y.observer.map(spy)
  it(xo).equals(yo)
  d.set('b.c', 10)
  // all 2 change stream emit
  it(spy.callCount).equals(2)
  // stop 1 not effect 2
  s1(true)
  d.set('b.c', 11)
  it(spy.callCount).equals(3)
  s2(true)
  d.set('b.c', 12)
  it(spy.callCount).equals(3)
  yo.destroy()
  it(x.observer).equals(null)
  it(y.observer).equals(null)
})

it('.watch', () => {
  var spy = it.spy()
  var d = edata({
    a: 1, b: { c: 2 }
  })
  // null path test first
  const unwatch2 = d.get('b').watch(spy)
  const unwatch1 = d.watch('b', spy)
  d.set('b.c', 10)
  it(spy.callCount).equals(2)
  unwatch1()
  d.set('b.c', 11)
  it(spy.callCount).equals(3)
  unwatch2()
  d.set('b.c', 12)
  it(spy.callCount).equals(3)
})

it('nested getset', () => {
  var spy = it.spy()
  var d = edata({
    air: {
      value: 23, unit: 'F'
    }
  }, {
    baseClass: TestBaseClass
  })
  var air = d.cut('air')
  air.observer.map(spy)
  air.getset('value', v => v.value + 1)
  it(spy.callCount).equals(1)
  air.getset('unit', v => {
    air.getset('value', v => v.value * 2)
    return 'C'
  })
  it(spy.callCount).equals(3)
})

it('add intermediate object when set', () => {
  const results = [
    ['create', ['a'], {}],
    ['create', ['a', 'b'], {}],
    ['add', ['a', 'b', 'c'], 10],
    ['update', ['a'], 1],
    ['update', ['a'], 2]
  ]
  var d = edata({}, {
    baseClass: TestBaseClass
  })
  d.observer.map(({ type, path, data }) => {
    const [_type, _path, _value] = results.shift()
    it(type).deepEquals(_type)
    it(path).deepEquals(_path)
    it(data.value).deepEquals(_value)
  })
  d.set('a.b.c', 10)
  d.set('a', 1)
  d.set('a', 2)
})

it('setMany', () => {
  var d = edata({}, {
    baseClass: TestBaseClass,
    plugins: [
      require('../plugins/set-many').default
    ]
  })
  d.setMany({
    'a.b': 1,
    'x': 2
  })
  it(d.unwrap()).deepEquals({
    a: { b: 1 },
    x: 2
  })

  // test descriptors
  d.setMany({
    y: 3
  }, {
    y: {}
  })
  it(d.unwrap()).deepEquals({
    a: { b: 1 },
    x: 2
  })
  it(d.value.y.value).deepEquals(3)
  const r = d.setMany({
    x: 10, y: 20
  })
  it(r.x.unwrap()).equals(10)
  it(r.y.unwrap()).equals(20)
})

it('hold change', () => {
  var spy = it.spy()
  var root = edata({
    a: { b: 1 },
    x: 2
  }, {
    baseClass: TestBaseClass
  })
  var d = root.cut('a')
  d.observer.map(spy)
  d.observer.hold = (true)
  d.set('x', 3)
  it(spy.callCount).equals(0)
  d.observer.skip = (true)
  d.set('x', 4)
  d.observer.skip = (false)
  it(spy.callCount).equals(0)
  d.set('y', 5)
  it(spy.callCount).equals(0)
  d.observer.hold = (false)
  it(spy.callCount).equals(2)
})

it('skip change', () => {
  var spy = it.spy()
  var d = edata({
    a: { b: 1 },
    x: 2
  }, {
    baseClass: TestBaseClass
  })
  // d = d.cut('a')
  d.observer.map(spy)
  d.observer.skip = (true)
  d.set('x', 3)
  it(spy.callCount).equals(0)
  d.set('x', 4)
  it(spy.callCount).equals(0)
  d.set('y', 5)
  it(spy.callCount).equals(0)
  d.observer.skip = (false)
  it(spy.callCount).equals(0)
})

it('unwrap map', () => {
  const c = {
    displayName: 'c',
    store: {
      odpsData: []
    },
    actions: {
      getOdps: {
        async: true,
        reducer: {
          success: (store, action) => {
            store.odpsData = action.data
          }
        }
      }
    }
  }

  const d = edata(
    {
      store: {
        [c.displayName]: new TestBaseClass(c.store)
      },
      api: {
        getOdps: {
          url: 'http://www.baidu.com',
          method: 'get'
        },
        postOdps: {
          url: 'http://www.baidu.com',
          method: 'post'
        }
      }
    },
    {
      unwrapConfig: packer => {
        // console.log(obj.path)
        const { path } = packer || {}
        if (packer && /api/.test(path)) {
          const res = path[1]
          return {
            map: (val) => {
              return Promise.resolve(val)
                .then(val => {
                  val.x = 10
                  c.actions[res].reducer.success(c.store, {
                    data: [1234]
                  })
                  return val
                })
            }
          }
        }
      }
    }
  )
  const result = d.unwrap('api.getOdps')
  it(typeof result.then).equals('function')
  result.then(val => {
    it(val.method).equals('get')
    it(val.x).equals(10)
    it(c.store.odpsData).deepEquals([1234])
  })
})

it('options.plugins', () => {
  const d = edata(
    { x: 1 },
    {
      plugins: [
        obj => {
          obj.add = function (n) {
            this.value = (this.value + n)
          }
        }
      ]
    }
  )
  d.get('x').add(2)
  it(d.unwrap('x')).equals(3)
})

it('should not dig into non-Array/POJO', () => {
  class MyClass {
    constructor () {
      this.abc = {
        x: 1
      }
    }
  }
  const d = edata({
    x: 1,
    b: new MyClass()
  })
  it(d.value.b.value.constructor).equals(MyClass)
  it(d.value.b.value.abc.x).equals(1)
})

it('plugins - combine', () => {
  var spy = it.spy()
  var c = edata({ a: 1, b: { c: 2 } }, {
    baseClass: TestBaseClass,
    plugins: [
      // require('../src/plugins/combine')
    ]
  })
  var t = new TestBaseClass(0)
  var combined = c.combine(['a', 'b.c', t])
  combined.on('change', ([a1, a2, a3]) => c.set('x', a1 + a2 + a3))
  combined.check()
  c.get('x').map(spy)
  it(c.unwrap('x')).equals(3)
  c.set('a', 2)
  it(c.unwrap('x')).equals(4)
  t.value = 10
  it(c.unwrap('x')).equals(14)
  combined.end()
  c.set('a', 3)
  it(c.unwrap('x')).equals(14)
  it(spy.callCount).equals(2)
  // should not compute for non-exists
  it(c.combine(['v', 'w'])).equals(false)
})

it('setComputed', () => {
  const root = edata({
    firstName: 'Hello',
    lastName: 'World'
  })
  const dispose = root.setComputed(
    'fullName',
    ['firstName', 'lastName'],
    ([firstName, lastName]) => firstName + ' ' + lastName
  )
  it(root.unwrap('fullName')).equals('Hello World')
  root.set('firstName', 'Green')
  it(root.unwrap('fullName')).equals('Green World')
  dispose()
  root.set('firstName', 'Good')
  it(root.unwrap('fullName')).equals('Green World')
})

it('plugins - action', () => {
  var spy = it.spy()
  var spyB = it.spy()
  var c = edata({ a: 1, b: { c: 2 } }, {
    plugins: [
      require('../plugins/actions').default
    ]
  })
  c.observer.map(e => {
    it(e.meta.isAction).equals(true)
    spy()
  })
  var b = c.cut('b')
  b.observer.map(e => {
    it(e.meta.isAction).equals(true)
    spyB()
  })

  c.dispatch({ type: 'unset:b.c' })
  it(c.unwrap()).deepEquals({ a: 1, b: { } })
  it(spy.callCount).equals(1)
  it(spyB.callCount).equals(1)

  c.dispatch({ type: 'set:b.c', data: 3 })
  it(c.unwrap()).deepEquals({ a: 1, b: { c: 3 } })
  it(spy.callCount).equals(2)
  it(spyB.callCount).equals(2)
})

it('context', () => {
  var c = edata({
    'abc': {
      'def': {
        'def': {
          'bc': {
            data: 1234
          }
        }
      }
    }
  }, {
    baseClass: TestBaseClass
  })
  const data = c.get('abc.def.def.bc.data')
  const model1 = c.cut('abc.def')
  const model2 = c.cut('abc.def.def')
  it(data.context()).deepEquals(model2)
})

it('closest', () => {
  var c = edata({
    'abc': {
      'def': {
        'def': {
          'bc': {
            data: 1234
          }
        }
      }
    },
    'uvw': {
      'xyz': 234
    }
  }, {
    baseClass: TestBaseClass
  })
  const data = c.get('abc.def.def.bc.data')
  // find root
  it(data.closest('')).equals(c.get('abc.def.def.bc'))
  it(data.closest()).equals(c.get('abc.def.def.bc'))
  // find parent
  it(data.closest(/./).path.join('.')).equals('abc.def.def.bc')
  it(data.closest('bc').path.join('.')).equals('abc.def.def.bc')
  it(data.closest('abc.def.def.bc').path.join('.')).equals('abc.def.def.bc')
  it(data.closest('def').path.join('.')).equals('abc.def.def')
  it(data.closest('def.def').path.join('.')).equals('abc.def.def')
  it(data.closest(/\.def\./).path.join('.')).equals('abc.def.def')
  it(data.closest(/.*/).path.join('.')).equals('abc.def.def.bc')
  it(data.closest(/not.exist/)).equals(undefined)
})

it('big json', () => {
  var json = require('./big.json')
  console.time('big_json')
  var d = edata(json, {
    baseClass: TestBaseClass
  })
  d.unwrap()
  console.timeEnd('big_json')
})

it('deep nested', () => {
  var val
  function newList (count) {
    let head = { value: count, next: null }
    while (--count) { head = { value: count, next: head } }
    return head
  }

  function contains (list, x) {
    if (!list) { return false }
    if (list.value == x) { return true }
    return contains(list.next, x)
  }

  console.time('CreateList')
  // v0.8.2 safe: count = 885
  var count = 1100
  var list = newList(count)
  // contains(list)
  let d = edata(list)
  d.unwrap()
  console.timeEnd('CreateList')
})

it('.proxy', () => {
  var d = edata({
    obj: { y: { z: 10 } },
    arr: [{ id: 1 }, { id: 2 }]
  })
  var spy = it.spy()
  d.observer.map(spy)

  // with path
  it(d.proxy('obj').y.z).equals(10)
  it(d.proxy('obj.y').z).equals(10)
  // no auto create for non-exists
  it(d.proxy().zz).equals(undefined)

  var p = d.proxy({ autoCreate: true })
  it(p.obj.y.z).deepEquals(10)
  it(p.obj.y.__edata__.unwrap()).deepEquals({ z: 10 })
  // auto create
  it(p.xx.yy.__target__).deepEquals({})
  it(spy.callCount).equals(2) // created: xx and yy
  // auto set
  p.aa.bb = { x: 10 } // created: aa, bb
  it(p.aa.bb.x).deepEquals(10)
  it(spy.callCount).equals(4)
  // array test
  it(p.arr[0].id).equals(1)
  it(p.arr[0].__edata__.toJSON()).deepEquals({ id: 1 })
  it(p.arr[0].xx = 10).deepEquals(10)
  // edata method
  it(p.arr.push({ yy: 10 })).equals(3)
  it(p.arr[2].__isProxy__).equals(true)
  it(p.arr[2].__edata__.unwrap()).deepEquals({ yy: 10 })
  it(p.arr.pop().__target__).deepEquals({ yy: 10 })
  it(p.arr.slice().__edata__).equals(undefined)
  it(p.arr.slice().map(v => v.__edata__.unwrap())).deepEquals([
    { id: 1, xx: 10 },
    { id: 2 }
  ])
  it(p.arr.map(v => v.__edata__.unwrap())).deepEquals([
    { id: 1, xx: 10 },
    { id: 2 }
  ])
  // should have __edata__
  it(p.arr[0].xx.__target__).deepEquals(undefined)
  it(p.arr[0].xx.__edata__).deepEquals(undefined)
  it(!!p.arr[0].__edata__).deepEquals(true)
  it(!!p.arr.__edata__).deepEquals(true)
  it(!!p.__edata__).deepEquals(true)
  it(spy.callCount).equals(7)
})

it('.proxy frozen object', () => {
  var obj = { x: {}, b: { c: 1 }, c: { seal: 1 } }
  Object.defineProperty(obj.x, 'a', { value: 10 })
  Object.freeze(obj.b)
  Object.seal(obj.c)
  var d = edata({ obj: new TestBaseClass(obj) })
  it(d.proxy('obj').b).deepEquals({ c: 1 })
  it(d.proxy('obj').b.c).equals(1)
  it(d.proxy('obj').c.seal).equals(1)
})

it('.proxy with array methods', () => {
  var obj = { x: [1, 2, 3] }
  var d = edata(obj).proxy()
  it(d.x[0]).equals(1)
  var x = d.x.map(id => {
    // console.log(id)
    return Object.freeze({ id })
  })
  it(x[0].id).equals(1)
})

// run if not from cli
if (process.argv.pop() === __filename) {
  it.run()
}
