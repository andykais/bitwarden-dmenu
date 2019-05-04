const path = require('path')
const { CommandError } = require('./util/error')
const { spawnSync } = require('child_process')
const obfuscate = require('./util/obfuscate/bitwarden-cli')

const bwExecutable = path.resolve(__dirname, '../node_modules/.bin/bw')
module.exports = (...args) => {
  const execCommand = `${bwExecutable} ${args.join(' ')}`
  console.debug('$', obfuscate(execCommand))
  const commandProcess = spawnSync(bwExecutable, args)

  if (commandProcess.status !== 0) {
    throw new CommandError('bw command failed.', commandProcess)
  } else {
    return commandProcess.stdout.toString().trim()
  }
}
