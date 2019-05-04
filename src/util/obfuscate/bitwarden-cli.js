const obfuscateState = require('./')

module.exports = command =>
  obfuscateState.isTurnedOn()
    ? command
        .replace(/unlock\s.*--raw$/, `unlock ****** --raw`)
        .replace(/session=.*/, 'session=******')
        .replace(/login\s.*--raw/, 'login ****** ****** --raw')
    : command
