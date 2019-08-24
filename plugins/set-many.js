(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function default_1(root) {
        function setMany(kvMap, options) {
            var _this = this;
            if (options === void 0) { options = {}; }
            var obj = Array.isArray(kvMap) ? [] : {};
            Object.keys(kvMap).forEach(function (key) {
                obj[key] = _this.set(key, kvMap[key], options);
            });
            return obj;
        }
        root.setMany = setMany;
    }
    exports.default = default_1;
});
//# sourceMappingURL=set-many.js.map