'use strict'

import EventEmitter from 'es-mitt'
import pluginCombine from './plugins/combine'
import { stringToPath } from './utils.mjs'
// import { tco } from './tco'

export class EdataBaseClass extends EventEmitter {
  constructor () {
    super()
    if (arguments.length > 0) this._value = arguments[0]
  }
  get __isEdata__ () {
    return true
  }
  get value () {
    return this._value
  }
  set value (val) {
    const oldVal = this._value
    this._value = val
    this.emit('change', { data: val, oldData: oldVal, meta: this._meta || {} })
  }
  map (fn) {
    this.on('change', fn)
    return () => {
      this.off('change', fn)
    }
  }
  valueOf () {
    return this._value
  }
}

const { assign, keys, getPrototypeOf } = Object
const { toString, hasOwnProperty } = Object.prototype
const { isArray } = Array
const MUTATION_TYPE = {
  CREATE: 'create',
  ADD: 'add',
  UPDATE: 'update',
  DELETE: 'delete'
}

// https://github.com/sindresorhus/is-plain-obj
function isPOJO (x) {
  var prototype
  /* eslint-disable-next-line no-return-assign */
  return toString.call(x) === '[object Object]' &&
    (
      prototype = getPrototypeOf(x),
      prototype === null || prototype === getPrototypeOf({})
    )
}

function isFunction (obj) {
  return typeof obj === 'function'
}

function isPrimitive (val) {
  return val == null ||
    (
      typeof val !== 'function' && typeof val !== 'object'
    )
}

function getPath (path) {
  return isArray(path)
    ? path.map(p => isArray(p)
      ? p
      : (typeof p === 'number' ? [true, p] : [false, p])
    )
    : typeof path === 'number'
      ? [[true, path]]
      : stringToPath(String(path))
}

function edata (initData, config = {}) {
  let {
    baseClass: BaseClass,
    unwrapConfig = null,
    plugins = []
  } = config
  BaseClass = BaseClass || EdataBaseClass
  plugins.unshift(pluginCombine)
  class ObserverClass extends BaseClass {
    constructor (packed) {
      super()
      this.changeStack = []
      this._packed = packed
      this._skip = false
      this._hold = false
      this.meta = {}
      this.count = 0
    }
    get skip () {
      return this._skip
    }
    set skip (_skip) {
      this._skip = _skip
      this.emit('skip', _skip)
    }
    get hold () {
      return this._hold
    }
    set hold (_hold) {
      this._hold = _hold
      if (!_hold) {
        this.changeStack.forEach(v => {
          this.value = v
        })
        this.changeStack = []
      }
      this.emit('hold', _hold)
    }
    set value ({ data, type, meta, changeArgs }) {
      const { root } = this._packed
      if (!root || root.observer.skip || this.skip) return
      this.count++
      if (changeArgs == null) {
        changeArgs = { path: data.path }
      }
      const baseVal = { data, type, meta: { ...this.meta, ...meta } }
      if (this.hold) {
        this.changeStack.push(baseVal)
      } else {
        this._value = (assign(baseVal, changeArgs))
        this.emit('change', this._value)
      }
    }
  }
  let wrapper = (init) => new BaseClass(init)
  let isWrapper = (obj) => {
    return obj instanceof BaseClass || obj instanceof EdataBaseClass
  }

  function isWrappedData (obj) {
    return isWrapper(obj) &&
    'root' in obj &&
    'path' in obj &&
    isFunction(obj.get)
  }

  function isPrimitive2 (val) {
    return isPrimitive(val) || isWrapper(val)
  }

  function shouldNotDig (val) {
    return isPrimitive2(val) || !(isArray(val) || isPOJO(val) || Object.isFrozen(val))
  }

  function _checkCacheAndUnwrap (config, _cache, val, result, key) {
    const prev = _cache.get(val)
    if (prev != null) {
      !config.json && prev.push(() => {
      /* eslint-disable-next-line no-unused-vars */
        const [r, k] = prev
        result[key] = k == null ? r : r[k]
      })
    } else {
      _cache.set(val, [result, key])
      result[key] = _unwrap(val, config, _cache)
    }
    return prev
  }

  function _unwrap (obj, config, _cache) {
    let isRoot = _cache == null
    if (isRoot) {
      _cache = new Map([[obj, []]])
    }

    let result
    let source = obj
    if (isWrappedData(source)) {
      result = _unwrap(source.value, config, _cache)
    } else if (isArray(source)) {
      result = []
      source.forEach((val, key) => {
        _checkCacheAndUnwrap(config, _cache, val, result, key)
      })
    } else if (isPOJO(source)) {
      result = {}
      keys(source).forEach(key => {
        const val = source[key]
        _checkCacheAndUnwrap(config, _cache, val, result, key)
      })
    } else {
      while (isWrapper(source)) {
        source = source.value
      }
      result = source
    }
    if (isRoot) {
      _cache.forEach(v => {
        if (isFunction(v[2])) {
          v[2]()
        }
      })
      if (isFunction(config.map)) result = config.map(result)
    }
    return result
  }

  function wrapSource (source) {
    let root

    let _cache = null
    function deepIt (a, b, callback, path) {
      _cache = _cache || new Map()
      path = isArray(path) ? path : []
      if (shouldNotDig(b)) return bindMethods(wrapper(a), path)
      for (let key in b) {
        if (!hasOwnProperty.call(b, key)) continue
        // return false stop the iteration
        const ret = callback(a, b, key, path, _cache)
        if (ret === false) break
        else if (ret === 0) continue
        const aval = a[key]
        const bval = b[key]
        if (!isPrimitive2(bval) && isWrapper(aval) && !isPrimitive(aval.value)) {
          const prev = _cache.get(bval)
          if (prev == null) {
            const _path = path.concat({ key })
            _cache.set(bval, [a, key])
            deepIt(aval.value, bval, callback, _path)
          } else {
            // recursive found
          }
        }
      }
      return a
    }

    root = createWrap(source, [])

    function watch (path, fn) {
      if (isFunction(path)) {
        fn = path
        path = null
      }
      const { observer } = this.cut()
      return path == null
        ? observer.map(fn)
        : observer.map(e => {
          const p = e.path.join('.')
          if (path instanceof RegExp ? path.test(p) : String(path) === p) {
            fn(e)
          }
        })
    }

    function cut (path, from, filter) {
      const obj = this
      let targetObj = obj.get(path)
      if (targetObj == null) {
        targetObj = obj.set(path, {})
      }
      if (isWrapper(targetObj.observer)) {
        return targetObj
      }
      const part = makeChange(targetObj)
      if (!isWrapper(part)) return part
      const { observer } = part
      const targetRoot = from || root
      const subPath = targetObj.path
      // const subPath = getPath(path).map(v => v[1])
      if (!isFunction(filter)) {
        filter = (arg) => arg.path.join().indexOf(arg.subPath.join()) === 0
      }
      const watchFn = ({ data, type, meta, path }) => {
        if (filter({ data, type, path, subPath })) {
          observer.value = {
            data,
            type,
            meta,
            changeArgs: {
              path: data.path.slice(subPath.length)
            }
          }
        }
      }
      targetRoot.observer.on('change', watchFn)
      observer.destroy = () => {
        targetRoot.observer.off('change', watchFn)
        part.observer.all = []
        part.observer = null
      }
      return part
    }

    function makeChange (packed) {
      if (!isWrapper(packed)) {
        return packed
      }
      const _change = new ObserverClass(packed)
      // const oldMap = _change.map
      // _change.map = function (fn) {
      //   const _fn = _change.count > 0 ? ignoreFirstCall(fn) : fn
      //   return oldMap.call(this, _fn)
      // }
      packed.observer = _change
      packed.MUTATION_TYPE = MUTATION_TYPE
      return packed
    }

    function bindMethods (packed, path, type = MUTATION_TYPE.UPDATE) {
      if ('path' in packed && 'root' in packed) return packed
      // type: 0->CHANGE, 1->ADD, 2->DELETE
      packed.root = root
      packed._path = path
      Object.defineProperty(packed, 'path', {
        get () {
          return path.map(v => v.key)
        },
        enumerable: true
      })
      packed.on('change', (e) => {
        if (root.observer == null) return
        root.observer.value = ({ data: packed, meta: { oldData: e.oldData, ...e.meta }, type: MUTATION_TYPE.UPDATE })
      })
      root.observer.value = {
        data: packed,
        type
      }
      packed.of = wrapper
      packed.wrap = val => createWrap(val, path)
      packed.cut = cut
      packed.watch = watch
      packed.closest = closest
      packed.context = context
      packed.get = get
      packed.set = set
      packed.getset = getset
      packed.unset = unset
      packed.proxy = proxy
      packed.unwrap = unwrap
      packed.toJSON = () => packed.unwrap({ json: true })
      if (isArray(packed.value)) {
        packed.push = push
        packed.pop = pop
        packed.shift = shift
        packed.unshift = unshift
        packed.copyWithin = copyWithin
        packed.fill = fill
        packed.reverse = reverse
        packed.sort = sort
        packed.splice = splice
      }
      packed.util = {
        isWrapper,
        wrapSource,
        createWrap
      }
      plugins.forEach(plugin => {
        plugin(packed)
      })
      return packed
    }

    function createWrap (source, prevPath = []) {
      let packed = wrapper()
      const isRoot = _cache == null
      if (isRoot) {
        _cache = new Map([[source, [packed, null]]])
        root = makeChange(packed)
      }
      let skip = root.observer.skip
      root.observer.skip = (true)

      if (shouldNotDig(source)) {
        packed = bindMethods(wrapper(source), prevPath)
        root.observer.skip = (skip)
        return packed
      }

      const target = isArray(source) ? [] : isPOJO(source) ? {} : source
      packed.value = (deepIt(target, source, (a, b, key, path) => {
        const _path = path.concat({ key })
        const bval = b[key]
        if (bval === undefined) a[key] = wrapper()
        else if (shouldNotDig(bval)) a[key] = wrapper(bval)
        else {
          const prev = _cache.get(bval)
          if (prev == null) {
            _cache.set(bval, [a, key])
            a[key] = createWrap(bval, _path)
          } else {
            prev.push(() => {
              /* eslint-disable-next-line no-unused-vars */
              const [x, k] = prev
              a[key] = k == null ? x : x[k]
              bindMethods(a[key], k == null ? [] : _path)
            })
          }
        }
        if (a[key] != null) {
          bindMethods(a[key], _path)
        }
      }, prevPath))

      const ret = bindMethods(packed, prevPath)

      if (isRoot) {
        _cache.forEach(v => {
          if (isFunction(v[2])) {
            v[2]()
          }
        })
      }
      root.observer.skip = (skip)
      return ret
    }

    function context () {
      let { path, root } = this
      let latestRoot = root
      for (let i = 0; i < path.length; i++) {
        root = root.value[path[i]]
        if ('observer' in root && root.observer instanceof ObserverClass) {
          latestRoot = root
        }
      }
      return latestRoot
    }

    function closest (path) {
      if (path == null) {
        path = /./
      }
      let lastPos = -1
      const obj = this
      const reg = new RegExp(path instanceof RegExp ? path : '\\b' + path + '\\b', 'g')
      const pathString = obj.path.slice(0, -1).join('.')
      while (reg.exec(pathString)) {
        const { lastIndex } = reg
        if (lastPos === lastIndex) {
          return root.get(pathString)
        }
        lastPos = lastIndex
      }
      if (lastPos > -1) {
        const pos = pathString.indexOf('.', lastPos)
        return root.get(
          pos > -1
            ? pathString.slice(0, pos)
            : pathString
        )
      }
    }

    function get (path) {
      if (path == null) return this
      let obj = this
      let n = obj
      path = getPath(path)
      for (let i = 0, len = path.length; i < len; i++) {
        if (!isWrapper(n)) {
          break
        }
        n = n.value[path[i][1]]
      }
      return n
    }

    function set (path, value, options) {
      if (arguments.length <= 1) {
        value = path
        path = []
      }
      const func = () => value
      return this.getset(path, func, options)
    }

    function getset (path, func, { descriptor, meta } = {}) {
      let obj = this
      if (!isWrapper(obj)) return obj

      if (arguments.length <= 1 && isFunction(path)) {
        func = path
        path = []
      }

      path = getPath(path)

      let value, action
      /* eslint-disable-next-line no-unused-vars */
      let i; let len; let t; let nextIsArray; let p; let n = obj.value

      if (!path.length) {
        obj.value = (createWrap(func(obj), obj._path.slice()).value)
        value = obj
        action = MUTATION_TYPE.UPDATE
      } else {
        const _path = path.map(v => ({ key: v[1] }))
        for (i = 0, len = path.length - 1; i < len; i++) {
          [t, p] = path[i]
          ;[nextIsArray] = path[i + 1]
          if (!isWrapper(n[p])) {
            n[p] = bindMethods(
              wrapper(nextIsArray ? [] : {}),
              _path.slice(0, i + 1),
              MUTATION_TYPE.CREATE
            )
          }
          n = n[p].value
        }
        [t, p] = path[i]
        if (isWrapper(n[p])) {
          value = n[p]
          value._meta = meta
          n[p].value = (createWrap(func(n[p]), obj._path.concat(_path)).value)
          value._meta = null
          action = MUTATION_TYPE.UPDATE
        } else {
          value = createWrap(func(n[p], true), obj._path.concat(_path))
          if (isPrimitive(descriptor)) {
            // Maybe Throw:
            // Cannot create property 'z' on number '10'
            n[p] = value
          } else {
            // Maybe Throw:
            // Object.defineProperty called on non-object
            Object.defineProperty(n, p, assign({ value }, descriptor))
          }
          action = MUTATION_TYPE.ADD
          root.observer.value = {
            data: value,
            type: action,
            meta
          }
        }
      }

      return value
    }

    function unset (path) {
      let obj = this
      if (!isWrapper(obj)) return
      if (path == null) {
        const p = getPath(obj.path)
        path = [p.pop()]
        obj = root.get(p)
        // console.log(333, obj);
      } else {
        path = getPath(path)
      }
      let len = path.length
      let val = obj.get(path.slice(0, -1))
      if (val == null) return
      let parent = val.value
      /* eslint-disable-next-line no-unused-vars */
      let [t, p] = path[len - 1]
      if (!(p in parent)) return
      let deleteVal = parent[p]
      delete parent[p]
      root.observer.value = {
        data: deleteVal,
        type: MUTATION_TYPE.DELETE
      }
      return isWrapper(deleteVal)
        ? deleteVal.unwrap()
        : deleteVal
    }

    function proxy (path, config) {
      if (arguments.length === 1 && isPOJO(path)) {
        config = path
        path = null
      }
      const obj = path != null
        ? this.get(path)
        : this
      return obj == null ? obj : observe(obj, { ...config })
    }

    function observe (edata, config) {
      function buildProxy (o, thisObject) {
        if (o == null || o.__isProxy__) {
          return o
        }

        const oIsEdata = isWrapper(o)

        let _target = o
        while (isWrapper(_target)) _target = _target.value

        const isObject = _target instanceof Object
        if (!isObject || Object.isFrozen(_target)) {
          return _target
        }

        return new Proxy(_target, {
          deleteProperty (target, property) {
            if (isWrapper(target[property])) {
              target[property].unset()
            } else if (oIsEdata) {
              o.unset(property)
            } else {
              // fallback to normal proxy
              return delete target[property]
            }
            return true
          },
          set (target, property, value) {
            //   console.log(target, property, value)
            if (isWrapper(target[property])) {
              target[property].set(value)
            } else if (oIsEdata) {
              o.set(property, value)
            } else {
              // fallback to normal proxy
              target[property] = value
            }
            return true
          },
          get (target, property) {
            // Special properties
            if (property === '__target__') return target
            if (property === '__isProxy__') return true
            if (property === '__edata__' && oIsEdata) return o
            if (property === '__watch__' && oIsEdata) {
              return o.watch.bind(o)
            }

            let shouldNotProxy = false
            if (hasOwnProperty.call(target, property)) {
              const desc = Object.getOwnPropertyDescriptor(target, property)
              shouldNotProxy = !desc.configurable && !desc.writable
              if (shouldNotProxy) {
                // console.log('no proxy:', o, target, property)
                return target[property]
              }
            }

            // Begin check
            let out
            if (property in target) {
              out = target[property]
            } else if (oIsEdata && config.autoCreate) {
              // it's edata
              out = o.set(property, {})
            } else {
              // nothing find
              return
            }
            let next = out
            while (isWrapper(out)) out = out.value
            if (typeof out === 'function') {
              const isEdataMethod = oIsEdata && typeof o[property] === 'function' && property !== 'map'
              return function (...args) {
                const ret = isEdataMethod
                  ? o[property](...args)
                  : out.apply(thisObject || (
                    Array.isArray(target) ? target.map(v => buildProxy(v)) : buildProxy(target)
                  ), args)

                if (Array.isArray(ret)) {
                  return ret
                }
                return ret instanceof Object
                  ? buildProxy(ret)
                  : ret
              }
            } else {
              return out instanceof Object
                ? buildProxy(next)
                : out
            }
          }
        })
      }
      return buildProxy(edata)
    }

    // Arrray Mutator methods
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Mutator_methods
    // copyWithin()
    // fill()
    // pop()
    // push()
    // reverse()
    // shift()
    // sort()
    // splice()
    // unshift()

    function copyWithin (target, start, end) {
      const { value } = this
      const copyArr = value.slice(start, end)
      const fromIndex = target
      const toIndex = target + copyArr.length
      value.slice(fromIndex, toIndex).forEach((item, i) => {
        this.set(i, copyArr[i].value)
      })
      return this
    }

    function fill (value, start, end) {
      const copyArr = this.value.slice(start, end)
      copyArr.forEach(item => {
        item.set(value)
      })
      return this
    }

    function reverse () {
      const { value } = this
      value.reverse().forEach((item, i) => {
        if (!item || !isArray(item._path)) {
          return
        }
        item._path[item._path.length - 1].key = i
        item.set(item.value)
      })
      return this
    }

    function sort (compareFunction) {
      const { value } = this
      value.sort(compareFunction).forEach((item, i) => {
        if (!item || !isArray(item._path)) {
          return
        }
        item._path[item._path.length - 1].key = i
        item.set(item.value)
      })
      return this
    }

    function splice (start, deleteCount, ...args) {
      const { value } = this
      const ret = []
      for (let i = start; i < start + deleteCount; i++) {
        ret.push(this.unset(i))
      }
      value.splice(start, deleteCount, ...args)
      args.forEach((val, i) => {
        this.set(start + i, val)
      })
      const delta = args.length - deleteCount
      // push array item AFTER start+delta
      if (delta) {
        for (let i = start + args.length; i < value.length; i++) {
          const item = value[i]
          if (!item || !isArray(item._path)) {
            continue
          }
          const path = item._path[item._path.length - 1]
          path.key = +path.key + delta
        }
      }
      return ret
    }

    function push (...items) {
      let len = this.value.length
      for (let index = 0; index < items.length; index++) {
        this.set(len, items[index]);
        len++
      }
      return len
    }

    function pop () {
      let len = this.value.length
      let val = this.unset(len - 1)
      this.value.pop()
      return val
    }

    function shift () {
      const { value } = this
      let val = this.unset(0)
      value.shift()
      value.forEach(item => {
        if (!item || !isArray(item._path)) {
          return
        }
        const path = item._path[item._path.length - 1]
        path.key = +path.key - 1
      })
      return val
    }

    function unshift (...values) {
      const { value } = this
      const length = value.unshift(...values)
      const len = values.length
      value.forEach((item, i) => {
        if (i < len) {
          this.set(i, item)
        } else {
          if (!item || !isArray(item._path)) {
            return
          }
          const path = item._path[item._path.length - 1]
          path.key = +path.key + len
        }
      })
      return length
    }

    function unwrap (path, config = {}) {
      if (arguments.length === 1 && isPOJO(path)) {
        config = path
        path = null
      }
      const obj = path != null
        ? this.get(path)
        : this
      return _unwrap(obj, {
        ...isFunction(unwrapConfig) && unwrapConfig(obj),
        ...config
      })
    }

    return root
  }
  return wrapSource(initData)
}
export default edata

export function edataProxy (obj, config = {}) {
  return edata(obj, { ...config, isProxy: true }).proxy()
}

edata.version = 'VERSION'
