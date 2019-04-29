import EventEmitter from "es-mitt/src/index";

type ValueOf<T> = T[keyof T];

declare interface MUTATION_TYPE {
    CREATE: 'create';
    ADD: 'add';
    UPDATE: 'update';
    DELETE: 'delete';
}

declare interface IDisposer {
    (): any;
}

declare class EdataBaseClass<T = any> extends EventEmitter {
    protected _value: T;
    /**
     * The wrapped value by this edata, maybe another child edata
     */
    public value: T;
    /**
     * > Shortcut to `on('change', callback)`
     * @returns {Function} Disposer function to off the `change` callback
     */
    map: (fn: Function) => IDisposer;
    /**
     * Return `.value`, to be used with operation like `edata + 123`
     */
    valueOf: () => any;
}

declare class ObserverClass<T = any> extends EdataBaseClass<T> {
    public skip: boolean;
    public hold: boolean;
}

declare interface IOptions {
    baseClass: EdataBaseClass;
    unwrapConfig: IUnwrapConfig;
    plugins: Array<(packer: edata) => void>
}

declare function edataConstructor (options?: Partial<IOptions>): edataFactory;

declare interface edataFactory {
    (data: any): edataRoot;
}

declare interface IUnwrapConfig {
    json?: boolean;
    map?: (val: any) => IDisposer;
}

/**
 * The value emitted when observer got `change` event
 */
declare interface IObserverValue {
    data: edata,
    type: ValueOf<MUTATION_TYPE>,
    path: string[]
}


declare interface edata extends EdataBaseClass {
    /**
     * The root edata that hold all the things
     */
    root: edataRoot;
    /**
     * Current path from root or context edata
     */
    path: string[];
    /**
     * > Wrap value into an edata.
     * This is important for performance when `.unwrap` for large deep tree, unwrap will only unwrap outer level of `edata(edata)` structure, and will not going deep for better performance, so `edata.of(value)` is made atom.
     * 
     * ```js
     * var d = root.set('a.b', root.of({x: {y: 10}}));
     * d.get('a.b.x.y') // -> undefined
     * d.unwrap('a.b') // {x: {y: 10}}
     * ```
     * 
     * @param value {any} The value want to wrap
     * @returns {edata} The wrapped edata
     */
    of(value: any): EdataBaseClass;
    /**
     * > get nested edata from path, and attach a `observer` edata object to observe scope mutations that the `root.path` starts with path.
     * The `edata.observer` edata object's value has `path` property to reflect the sub path of the sliced data.
     * 
     * ```js
     * var xy = root.slice('x.y')
     * xy.observer.on('change', ({data, type, path})=>console.log(type, path))
     * xy.set('z', 1)
     * // x.y changed! ['z']
     * ```
     * @param path {string|string[]} The path to edata to be sliced
     * @param from {edata} (optional) The target edata root to be sliced
     * @param filter {Function} (optional) The filter to apply when sliced
     * @returns {edata} which have a `.observer` edata object
     */
    slice(
        path: string | string[],
        from?: edata,
        filter?: (data: IObserverValue) => boolean,
    ): edataRoot | undefined;
    /**
     * > Find `edata` up from **context parent**, which has been `.slice()`d and has `observer` on it.
     * @returns {edataRoot} Closest sliced `edata` or `root`
     */
    context(): edataRoot;
    /**
     * > Find `edata` up from **closest parent**, with matching path using `RegExp` or string.
     * @param path {string|string[]|RegExp} The target path segment
     * @returns {edata} The matching edata as closest
     */
    closest(path: string | string[]): edata | undefined;
    /**
     * > Get nested edata from path, path is array of string or dot(`"."`) seperated string.
     * @param path {string|string[]} The path to get edata
     * @returns  edata at `path`
     */
    get(path: string | string[]): edata | undefined;
    /**
     * > Set value into nested edata.
     * @param value {any} Set value to edata
     * @returns {edata} The edata itself
     */
    set(value: any): edata;
    /**
     * > Set value into nested edata from path, the `descriptor` only applied when path not exists.
     * non-exist path will be auto created
     * @param path {string} The path to set value
     * @param value {any} Set value to edata
     * @returns {edata} The edata itself
     */
    set(path: string | string[], value: any, descriptor?: object): edata;
    /**
     * > Combine array of source edata into one target edata, any change of source will emit change event of target
     * @param edataArray {edata[] | string[]} The edata array, can be path string
     * @returns {edata} The combined target edata
     */
    combine(edataArray: string[] | edata[]): edataCombined;
    /**
     * > Set target path from edataArray changes, using return value of combineFunc
     * @param path {string|string[]} Target path to update when edataArray changed
     * @param edataArray {string[]} Source path to observe for change
     * @param combineFunc {Function} Computation function to set to target path
     */
    setComputed(path: string | string[], edataArray: any[], combineFunc: (args: edata[])=>void): IDisposer;
    // setMany(kvMap: object, descriptors?: object): object;
    /**
     * > Like `set`, but value is from a function, it let you set `value` based on previous value, the `descriptor` only applied when `empty` is `true`.
     * @param valueFn {Function} Input prevVal, and return val will be set to edata
     * @returns {edata} The source edata
     */
    getset(valueFn: (prevVal: edata | undefined) => any): edata;
    /**
     * > Like `set`, but value is from a function, it let you set `value` based on previous value, the `descriptor` only applied when `empty` is `true`.
     * @param path {string | string[]} The target path to be set
     * @param valueFn {Function} Input prevVal, and return val will be set to edata
     * @returns {edata} The source edata
     */
    getset(path: string | string[], valueFn: (prevVal: edata | undefined) => any, descriptor?: object): edata;
    /**
     * > Delete `edata` or `value` in `path`
     * @param path {string | string[]} The target path to be deleted
     */
    unset(path: string | string[]): any;
    /**
     * > unwrap data and nested data while keep data structure, any level of `wrapper` will be stripped.
     * If set `config` arg with `{json: true}`, then any circular referenced data will be set `undefined`, suitable for `JSON.stringify`.
     * If set `config` arg with `{map: value=>...}`, then the final value is first mapped, then returned, and the return value of `unwrapConfig` will be merged into this config.
     * @param config {object} The object contain function to transform the unwrapped value
     * @returns {any} The unwrapped data
     */
    unwrap(config?: IUnwrapConfig): any;
    /**
     * > unwrap data and nested data while keep data structure, any level of `wrapper` will be stripped.
     * If set `config` arg with `{json: true}`, then any circular referenced data will be set `undefined`, suitable for `JSON.stringify`.
     * If set `config` arg with `{map: value=>...}`, then the final value is first mapped, then returned, and the return value of `unwrapConfig` will be merged into this config.
     * @param path {string | string[]} The path to be unwrapped
     * @param config {object} The object contain function to transform the unwrapped value
     * @returns {any} The unwrapped data
     */
    unwrap(path: string | string[], config?: IUnwrapConfig): any;
    /**
     * > Just invoke `.unwrap({json: true})`
     */
    toJSON(): string;
    /**
     * Methods from plugins
     */
    [pluginMethods: string]: any;
}

declare interface edataCombined extends edata {
    /**
     * Check the source edata array for change now
     * @returns {edata[] | undefined}
     */
    check(): edata[] | undefined;
    /**
     * End the combine, stop observe changes from source edata array
     */
    end(): void;
}

declare interface edataRoot extends edata {
    /**
     * The observer which will emit `change` event for any data changes inside the root
     */
    observer: ObserverClass<IObserverValue>;
    /**
     * create / add / update /delete
     */
    MUTATION_TYPE: MUTATION_TYPE
}

export default edataConstructor;
export {
    EdataBaseClass
};

