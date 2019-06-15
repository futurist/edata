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
        function dispatch(action) {
            // action: {type: 'set:a.b', data: 'data'}
            var type = action.type, data = action.data;
            var colon = type.indexOf(':');
            var mutation = type.substring(0, colon);
            var path = type.substring(colon + 1);
            root.observer.meta.isAction = true;
            switch (mutation) {
                case 'set':
                    root.set(path, data);
                    break;
                case 'unset':
                    root.unset(path);
                    break;
            }
            root.observer.meta.isAction = false;
        }
        root.dispatch = dispatch;
    }
    exports.default = default_1;
});
//# sourceMappingURL=actions.js.map