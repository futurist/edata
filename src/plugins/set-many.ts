///<reference path="../../index.d.ts"></reference>
interface PlainObject {
  [key:string]: any
}

export default function setMany (root: PlainObject, util: PlainObject) {
  function setMany (this: any, kvMap: PlainObject, descriptors: {[key:string]: any} = {}) {
    const obj: any = Array.isArray(kvMap) ? [] : {}
    Object.keys(kvMap).forEach(key => {
      obj[key] = this.set(key, kvMap[key], descriptors[key])
    })
    return obj
  }
  root.setMany = setMany
}

