module.exports = (root, {
  isWrapper,
  wrapSource
}) => {
  function combine (edataArray) {
    const arr = edataArray.map(r => isWrapper(r) ? r : this.get(r))
    if (arr.some(r => !isWrapper(r))) return false
    let allFullfilled = false
    const combinedData = wrapSource(undefined)
    const checkValues = () => {
      if (!allFullfilled) allFullfilled = arr.every(edata => '_value' in edata)
      if (allFullfilled) {
        combinedData.emit('change', arr)
      }
    }
    arr.forEach(edata => edata.on('change', checkValues))
    combinedData.end = () => {
      arr.forEach(edata => edata.removeListener('change', checkValues))
    }
    combinedData.check = checkValues
    return combinedData
  }
  root.combine = combine
}

