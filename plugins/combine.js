(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.edata_combine = factory());
}(this, (function () { 'use strict';

  var combine = function combine(root) {
    var _root$util = root.util,
        isWrapper = _root$util.isWrapper,
        wrapSource = _root$util.wrapSource;

    function combine(edataArray) {
      var _this = this;

      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$checkNow = _ref.checkNow,
          checkNow = _ref$checkNow === void 0 ? false : _ref$checkNow,
          filter = _ref.filter;

      var arr = edataArray.map(function (r) {
        return isWrapper(r) ? r : _this.get(r);
      });
      if (arr.some(function (r) {
        return !isWrapper(r);
      })) return false;
      var allFullfilled = false;
      var combinedData = wrapSource(undefined);

      var checkValues = function checkValues() {
        if (!allFullfilled) allFullfilled = arr.every(function (edata) {
          return '_value' in edata;
        });
        var shouldEmit = typeof filter === 'function' ? filter(arr) : true;

        if (allFullfilled && shouldEmit) {
          combinedData.emit('change', arr);
          return arr;
        }
      };

      arr.forEach(function (edata) {
        return edata.on('change', checkValues);
      });

      combinedData.end = function () {
        arr.forEach(function (edata) {
          return edata.off('change', checkValues);
        });
      };

      combinedData.check = checkValues;

      if (checkNow) {
        checkValues();
      }

      return combinedData;
    }

    function setComputed(path, edataArray, callback) {
      var combined = root.combine(edataArray);

      var onChange = function onChange(e) {
        root.set(path, callback(e));
      };

      combined.on('change', onChange);
      combined.check();
      return function () {
        combined.off('change', onChange);
        combined.end();
        combined = null;
      };
    }

    root.combine = combine;
    root.setComputed = setComputed;
  };

  return combine;

})));
