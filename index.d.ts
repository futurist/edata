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

declare class BaseClass<T = any> extends EventEmitter {
    protected _value: T;
    public value: T;
    map: (fn: Function) => IDisposer;
    valueOf: () => any;
}

declare class ObserverClass<T = any> extends BaseClass<T> {
    public skip: boolean;
    public hold: boolean;
}

declare interface IOptions {
    baseClass: BaseClass;
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

declare interface IObserverValue {
    data: edata,
    type: ValueOf<MUTATION_TYPE>,
    path: string[]
}


declare interface edata extends BaseClass {
    root: edataRoot;
    path: string[];
    of(value: any): BaseClass;
    slice(
        path: string | string[],
        filter?: (data: IObserverValue) => boolean,
        from?: edata
    ): edataRoot | undefined;
    context(path: string | string[]): edata | undefined;
    /**
     * > Get nested edata from path, path is array of string or dot(`"."`) seperated string.
     * @param path {string|string[]} The path to get edata
     * @returns  edata at `path`
     */
    get(path: string | string[]): edata | undefined;
    /**
     * > Set value into nested edata from path, the `descriptor` only applied when path not exists.
     * non-exist path will be auto created
     * @param value {any} Set value to edata
     * @returns {edata} The edata itself
     */
    set(value: any): edata;
    set(path: string | string[], value: any, descriptor?: object): edata;
    combine(edataArray: string[] | any[]): edataCombined;
    setComputed(path: string | string[], edataArray: any[], combineFunc: (args: edata[])=>void): IDisposer;
    // setMany(kvMap: object, descriptors?: object): object;
    getset(valueFn: (prevVal: edata | undefined) => any): edata;
    getset(path: string | string[], valueFn: (prevVal: edata | undefined) => any, descriptor?: object): edata;
    unset(path: string | string[]): any;
    unwrap(config?: IUnwrapConfig): any;
    unwrap(path: string | string[], config?: IUnwrapConfig): any;
    [pluginMethods: string]: any;
}

declare interface edataCombined extends edata {
    check: edata[] | undefined;
    end: Function;
}

declare interface edataRoot extends edata {
    observer: ObserverClass<IObserverValue>;
    MUTATION_TYPE: MUTATION_TYPE
}

export default edataConstructor;
export {};

