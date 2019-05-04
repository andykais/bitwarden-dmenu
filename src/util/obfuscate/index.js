class ObfuscateSingletonState {
  constructor() {
    this._obfuscate = true
  }

  turnOff() {
    this._obfuscate = false
  }

  isTurnedOn() {
    return this._obfuscate
  }
}

console.log('creating state')
const obfuscateState = new ObfuscateSingletonState()

module.exports = obfuscateState
