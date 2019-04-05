module.exports = (root, util) => {
  function setMany (kvMap, descriptors = {}) {
    const obj = Array.isArray(kvMap) ? [] : {}
    Object.keys(kvMap).forEach(key => {
      obj[key] = this.set(key, kvMap[key], descriptors[key])
    })
    return obj
  }
  root.setMany = setMany
}
