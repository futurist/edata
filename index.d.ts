import { EventEmitter } from "events";

type ValueOf<T> = T[keyof T];

declare interface MUTATION_TYPE {
    CREATE: 'create';
    ADD: 'add';
    CHANGE: 'change';
    DELETE: 'delete';
}

declare class WrapClass<T = any> extends EventEmitter {
    protected _value: T;
    public value: T;
}

declare interface IOptions {
    WrapClass: WrapClass;
    unwrapConfig: IUnwrapConfig;
    extensions: Array<(packer: IWrappedData) => void>
}

declare interface WrapFactory {
    (options?: Partial<IOptions>): DataFactory;
    DefaultClass: WrapClass
}

declare interface DataFactory {
    (data: any): IWrappedRoot;
}

declare interface IUnwrapConfig {
    json?: boolean;
    map?: (val: any) => any;
}

declare interface IChangeValue {
    data: IWrappedData,
    type: ValueOf<MUTATION_TYPE>,
    path: string[]
}

declare interface IDisposer {
    (): any;
}

declare interface IWrappedData extends WrapClass {
    root: IWrappedRoot;
    path: string[];
    wrap(value: any): WrapClass;
    slice(
        path: string | string[],
        filter?: (data: IChangeValue) => boolean,
        from?: IWrappedData
    ): IWrappedRoot | undefined;
    context(path: string | string[]): IWrappedData | undefined;
    get(path: string | string[], mapFunc?: (val: IWrappedData | undefined) => any): IWrappedData | undefined;
    set(value: any): IWrappedData;
    set(path: string | string[], value: any, descriptor?: object): IWrappedData;
    setComputed(path: string | string[], edataArray: any[], combineFunc: (...args: IWrappedData[])=>void): IDisposer;
    getMany(pathMap: object | string[] | string, mapFunc?: (val: IWrappedData | undefined) => any): object | Array<any> | IWrappedData | undefined;
    setMany(kvMap: object, descriptors?: object): object;
    getset(valueFn: (prevVal: IWrappedData | undefined) => any): IWrappedData;
    getset(path: string | string[], valueFn: (prevVal: IWrappedData | undefined) => any, descriptor?: object): IWrappedData;
    ensure(path: string | string[], value: any, descriptor?: object): IWrappedData;
    ensure(invalid: (prevVal: IWrappedData) => boolean, path: string | string[], value: any, descriptor?: object): IWrappedData;
    unset(path: string | string[]): any;
    unwrap(config?: IUnwrapConfig): any;
    unwrap(path: string | string[], config?: IUnwrapConfig): any;
}

declare interface IWrappedRoot extends IWrappedData {
    change: WrapClass<IChangeValue>;
    MUTATION_TYPE: MUTATION_TYPE
}

declare const edata: WrapFactory;
export = edata;

declare module 'edata' {
    export = edata;
}

