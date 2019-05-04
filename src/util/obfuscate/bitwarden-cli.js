const obfuscateState = require('./')

module.exports = command =>
  obfuscateState.isTurnedOn()
    ? command
        .replace(/unlock\s.*--raw$/, `unlock ****** --raw`)
        .replace(/session=.*/, 'session=******')
    : command
