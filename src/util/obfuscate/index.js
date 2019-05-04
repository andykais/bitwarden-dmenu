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

const obfuscateState = new ObfuscateSingletonState()

module.exports = obfuscateState
