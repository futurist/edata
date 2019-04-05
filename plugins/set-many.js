(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global['edata_set-many'] = factory());
}(this, (function () { 'use strict';

  var setMany = function setMany(root, util) {
    function setMany(kvMap) {
      var _this = this;

      var descriptors = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var obj = Array.isArray(kvMap) ? [] : {};
      Object.keys(kvMap).forEach(function (key) {
        obj[key] = _this.set(key, kvMap[key], descriptors[key]);
      });
      return obj;
    }

    root.setMany = setMany;
  };

  return setMany;

})));
