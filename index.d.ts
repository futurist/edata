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
    plugins: Array<(packer: IWrappedData) => void>
}

declare interface WrapFactory {
    (options?: Partial<IOptions>): DataFactory;
}

declare interface DataFactory {
    (data: any): IWrappedRoot;
}

declare interface IUnwrapConfig {
    json?: boolean;
    map?: (val: any) => IDisposer;
}

declare interface IChangeValue {
    data: IWrappedData,
    type: ValueOf<MUTATION_TYPE>,
    path: string[]
}


declare interface IWrappedData extends BaseClass {
    root: IWrappedRoot;
    path: string[];
    wrap(value: any): BaseClass;
    slice(
        path: string | string[],
        filter?: (data: IChangeValue) => boolean,
        from?: IWrappedData
    ): IWrappedRoot | undefined;
    context(path: string | string[]): IWrappedData | undefined;
    get(path: string | string[], mapFunc?: (val: IWrappedData | undefined) => any): IWrappedData | undefined;
    set(value: any): IWrappedData;
    set(path: string | string[], value: any, descriptor?: object): IWrappedData;
    combine(edataArray: string[] | any[]): IWrappedCombine;
    setComputed(path: string | string[], edataArray: any[], combineFunc: (args: IWrappedData[])=>void): IDisposer;
    // setMany(kvMap: object, descriptors?: object): object;
    getset(valueFn: (prevVal: IWrappedData | undefined) => any): IWrappedData;
    getset(path: string | string[], valueFn: (prevVal: IWrappedData | undefined) => any, descriptor?: object): IWrappedData;
    unset(path: string | string[]): any;
    unwrap(config?: IUnwrapConfig): any;
    unwrap(path: string | string[], config?: IUnwrapConfig): any;
    [pluginMethods: string]: any;
}

declare interface IWrappedCombine extends IWrappedData {
    check: IWrappedData[] | undefined;
    end: Function;
}

declare interface IWrappedRoot extends IWrappedData {
    observer: ObserverClass<IChangeValue>;
    MUTATION_TYPE: MUTATION_TYPE
}

declare const edata: WrapFactory;
export = edata;

declare module 'edata' {
    export = edata;
}

