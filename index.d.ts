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

declare interface EdataProxy {
  /**
   * The target of the proxy
   */
  __target__?: any;
  /**
   * Whether proxied by edata
   */
  __isProxy__?: any;
  /**
   * The original edata to be proxied
   */
  __edata__?: edata;
  /**
   * Shortcut of proxy.__edata__.watch(fn)
   */
  __watch__?: any;

  [k: string]: EdataProxy | any;
  [k: number]: EdataProxy | any;
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
    map: (fn: (e: IChangeValue)=>any) => IDisposer;
    /**
     * Return `.value`, to be used with operation like `edata + 123`
     */
    valueOf: () => any;
}

declare class ObserverClass<T = any> extends EdataBaseClass<T> {
    public skip: boolean;
    public hold: boolean;
    public meta: any;
    public count: any;
}

declare interface IOptions {
    baseClass: EdataBaseClass;
    unwrapConfig: IUnwrapConfig;
    plugins: Array<(edata: edata) => void>
}

declare function edataConstructor (initData: any, options?: Partial<IOptions>): edataRoot;
declare function edataProxy (initData: any, options?: Partial<IOptions>): EdataProxy;

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
    path: string[],
    meta: any,
}

declare interface IChangeValue {
  data: any,
  oldData: any,
  meta: any,
}

declare interface SetOptions {
  descriptor?: object
  meta: any
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
     * utils to help for plugins
     */
    util: any;
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
     * > Wrap value into an edata, recursively.
     * Reverse of `.unwrap`
     * 
     * ```js
     * var d = root.set('a.b', root.wrap({x: {y: 10}}));
     * d.get('a.b.x.y') // -> undefined
     * d.unwrap('a.b') // {x: {y: 10}}
     * ```
     * 
     * @param value {any} The value want to wrap
     * @returns {edata} The wrapped edata
     */
    wrap(value: any): edata;
    /**
     * > get nested edata from path, and attach a `observer` edata object to observe scope mutations that the `root.path` starts with path.
     * The `edata.observer` edata object's value has `path` property to reflect the sub path of the cut data.
     * 
     * ```js
     * var xy = root.cut('x.y')
     * xy.observer.on('change', ({data, type, path})=>console.log(type, path))
     * xy.set('z', 1)
     * // x.y changed! ['z']
     * ```
     * @param path {string|string[]} The path to edata to be cut
     * @param from {edata} (optional) The target edata root to be cut
     * @param filter {Function} (optional) The filter to apply when cut
     * @returns {edata} which have a `.observer` edata object
     */
    cut(
        path: string | string[],
        from?: edata,
        filter?: (data: IObserverValue) => boolean,
    ): edataRoot | undefined;
    /**
     * Shortcut of edata.cut().map(fn)
     * @param fn The function to .map()
     * @returns {Function} The disposer to stop watch
     */
    watch(
      fn: (e:IObserverValue) => any
    ): IDisposer;
    /**
     * Shortcut of edata.cut().map(fn), but only on path
     * @param path The path to watch, String or RegExp
     * @param fn The function to .map()
     * @returns {Function} The disposer function to stop watch
     */
    watch(
      path: string | RegExp,
      fn: (e:IObserverValue) => any
    ): IDisposer;
    /**
     * > Find `edata` up from **context parent**, which has been `.cut()`d and has `observer` on it.
     * @returns {edataRoot} Closest cut `edata` or `root`
     */
    context(): edataRoot;
    /**
     * > Find `edata` up from **closest parent**, with matching path using `RegExp` or string.
     * @param path {string|string[]|RegExp} The target path segment
     * @returns {edata} The matching edata as closest
     */
    closest(path?: string | string[]): edata | undefined;
    /**
     * > Get nested edata from path, path is array of string or dot(`"."`) seperated string.
     * @param path {string|string[]} The path to get edata
     * @returns  edata at `path`
     */
    get(path?: string | string[]): edata | undefined;
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
    set(path: string | string[], value: any, options: SetOptions): edata;
    /**
     * > Combine array of source edata into one target edata, any change of source will emit change event of target
     * @param arrayOfEdata {edata[] | string[]} The edata array, can be path string
     * @returns {edata} The combined target edata
     */
    combine(arrayOfEdata: string[] | edata[]): edataCombined;
    /**
     * > Set target path from arrayOfEdata changes, using return value of combineFunc
     * @param path {string|string[]} Target path to update when arrayOfEdata changed
     * @param arrayOfEdata {string[]} Source path to observe for change
     * @param combineFunc {Function} Computation function to set to target path
     */
    setComputed(path: string | string[], arrayOfEdata: any[], combineFunc: (args: edata[])=>void): IDisposer;
    // setMany(kvMap: object, descriptors?: object): object;
    /**
     * > Like `set`, but value is from a function, it let you set `value` based on previous value, the `descriptor` only applied when `empty` is `true`.
     * @param valueFn {Function} Input prevVal, and return val will be set to edata
     * @returns {edata} The source edata
     */
    getset(valueFn: (prevVal: edata | undefined) => any, options: SetOptions): edata;
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
     * @returns {any} The unset data unwrapped
     */
    unset(path?: string | string[]): any;
    /**
     * > Proxy .get/.set/.unset methods, and use plain property to get/set/delete
     * `config.autoCreate` set to `true`, will auto create `{}` for non-exists paths.
     * 
     * @param path {string | string[]} The target path to be the root of proxy
     * @returns {any} The proxy object, with __edata__ pointed to edata in each level
     */
    proxy(path: string | string[], config?: {autoCreate?: boolean}): EdataProxy;
    proxy(config?: {autoCreate?: boolean}): EdataProxy;
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

declare interface edataArray<T> extends edata {
    /**
     * Returns the this object after filling the section identified by start and end with value
     * @param value value to fill array section with
     * @param start index to start filling the array at. If start is negative, it is treated as
     * length+start where length is the length of the array.
     * @param end index to stop filling the array at. If end is negative, it is treated as
     * length+end.
     */
    fill(value: T, start?: number, end?: number): this;

    /**
     * Returns the this object after copying a section of the array identified by start and end
     * to the same array starting at position target
     * @param target If target is negative, it is treated as length+target where length is the
     * length of the array.
     * @param start If start is negative, it is treated as length+start. If end is negative, it
     * is treated as length+end.
     * @param end If not specified, length of the this object is used as its default value.
     */
    copyWithin(target: number, start: number, end?: number): this;

    /**
      * Removes the last element from an array and returns it.
      */
     pop(): T | undefined;
     /**
       * Appends new elements to an array, and returns the new length of the array.
       * @param items New elements of the Array.
       */
     push(...items: T[]): number;
     /**
       * Reverses the elements in an Array.
       */
     reverse(): T[];
     /**
       * Removes the first element from an array and returns it.
       */
     shift(): T | undefined;
     /**
       * Sorts an array.
       * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
       */
     sort(compareFn?: (a: T, b: T) => number): this;
     /**
       * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
       * @param start The zero-based location in the array from which to start removing elements.
       * @param deleteCount The number of elements to remove.
       */
     splice(start: number, deleteCount?: number): T[];
     /**
       * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
       * @param start The zero-based location in the array from which to start removing elements.
       * @param deleteCount The number of elements to remove.
       * @param items Elements to insert into the array in place of the deleted elements.
       */
     splice(start: number, deleteCount: number, ...items: T[]): T[];
     /**
       * Inserts new elements at the start of an array.
       * @param items  Elements to insert at the start of the Array.
       */
     unshift(...items: T[]): number;
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
    EdataBaseClass,
    edataRoot,
    edata,
    edataProxy,
    IObserverValue,
    IUnwrapConfig,
    MUTATION_TYPE,
    IDisposer,
    ObserverClass,
    edataConstructor,
    edataCombined,
    IOptions,
    edataArray
};

