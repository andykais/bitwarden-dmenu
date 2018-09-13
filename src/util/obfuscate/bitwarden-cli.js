module.exports = command =>
  command
    .replace(/unlock\s'.*'/, `unlock '******'`)
    .replace(/session=.*/, 'session=****** ')
