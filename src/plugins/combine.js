module.exports = (root) => {
  const {
    isWrapper,
    wrapSource
  } = root.util
  function combine (edataArray, {
    checkNow = false,
    filter
  } = {}) {
    const arr = edataArray.map(r => isWrapper(r) ? r : this.get(r))
    if (arr.some(r => !isWrapper(r))) return false
    let allFullfilled = false
    const combinedData = wrapSource(undefined)
    const checkValues = () => {
      if (!allFullfilled) allFullfilled = arr.every(edata => '_value' in edata)
      const shouldEmit = typeof filter === 'function' ? filter(arr) : true
      if (allFullfilled && shouldEmit) {
        combinedData.emit('change', arr)
        return arr
      }
    }
    arr.forEach(edata => edata.on('change', checkValues))
    combinedData.end = () => {
      arr.forEach(edata => edata.off('change', checkValues))
    }
    combinedData.check = checkValues
    if (checkNow) {
      checkValues()
    }
    return combinedData
  }

  function setComputed (path, edataArray, callback) {
    let combined = root.combine(edataArray)
    const onChange = e => {
      root.set(path, callback(e))
    }
    combined.on('change', onChange)
    combined.check()
    return () => {
      combined.off('change', onChange)
      combined.end()
      combined = null
    }
  }
  root.combine = combine
  root.setComputed = setComputed
}
