interface PlainObject {
  [key:string]: any
}

type RootType = PlainObject;

export default function (root: RootType) {
  function setMany (this: any, kvMap: PlainObject, descriptors: PlainObject = {}) {
    const obj: any = Array.isArray(kvMap) ? [] : {}
    Object.keys(kvMap).forEach(key => {
      obj[key] = this.set(key, kvMap[key], descriptors[key])
    })
    return obj
  }
  root.setMany = setMany
}

