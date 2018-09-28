const isArray = val => Array.isArray(val)

const isObject = val => val !== null && typeof val === 'object'

const traverseObject = applyFunc => any => {
  if (isObject(any)) {
    for (const key in any) {
      const val = any[key]
      any[key] = traverseObject(applyFunc)(val)
    }
    return any
  } else if (isArray(any)) {
    for (const i of any.keys()) {
      const val = any[i]
      any[i] = traverseObject(applyFunc)(val)
    }
    return any
  } else {
    return applyFunc(any)
  }
}

const replaceNonNullValues = traverseObject(v => {
  if (v === null || v === undefined) {
    return v
  } else {
    return '******'
  }
})

module.exports = object => {
  if (object) {
    const copied = JSON.parse(JSON.stringify(object))
    const obfuscatedObject = replaceNonNullValues(copied)
    return JSON.stringify(obfuscatedObject, null, 2)
  }
}
