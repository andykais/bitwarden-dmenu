module.exports = command =>
  command
    .replace(/unlock\s.*--raw$/, `unlock ****** --raw`)
    .replace(/session=.*/, 'session=******')
