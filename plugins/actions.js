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
    var A;
    (function (A) {
        var B;
        (function (B) {
            var x = 0;
            console.log(x);
        })(B = A.B || (A.B = {}));
    })(A = exports.A || (exports.A = {}));
    function default_1(root, util) {
        function dispatch(action) {
            // action: {path: 'a.b', type: 'add', value: 'value'}
            var path = action.path, type = action.type, value = action.value;
            var skip = root.observer.skip;
            root.observer.skip = true;
            switch (type) {
                case 'add':
                case 'change':
                    root.set(path, value);
                    break;
                case 'delete':
                    root.unset(path);
                    break;
            }
            root.observer.skip = skip;
        }
        root.dispatch = dispatch;
    }
    exports.default = default_1;
});
//# sourceMappingURL=actions.js.map