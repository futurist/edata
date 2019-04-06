(function (factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    var v = factory(require, exports)
    if (v !== undefined) module.exports = v
  } else if (typeof define === 'function' && define.amd) {
    define(['require', 'exports'], factory)
  }
})(function (require, exports) {
  'use strict'
  Object.defineProperty(exports, '__esModule', { value: true })
  function setMany (root, util) {
    function setMany (kvMap, descriptors) {
      var _this = this
      if (descriptors === void 0) { descriptors = {} }
      var obj = Array.isArray(kvMap) ? [] : {}
      Object.keys(kvMap).forEach(function (key) {
        obj[key] = _this.set(key, kvMap[key], descriptors[key])
      })
      return obj
    }
    root.setMany = setMany
  }
  exports.default = setMany
})
// # sourceMappingURL=set-many.js.map
