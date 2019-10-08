const path = require('path')
const { spawnSync } = require('child_process')
const { CommandError } = require('../util/error')
const obfuscate = require('../util/obfuscate/bitwarden-cli')

const bwExecutable = path.resolve(__dirname, '../../node_modules/.bin/bw')
module.exports = (...args) => {
  const execCommand = `${bwExecutable} ${args.join(' ')}`
  console.debug('$', obfuscate(execCommand))
  const commandProcess = spawnSync(bwExecutable, args)

  if (commandProcess.status === 0) {
    return commandProcess.stdout.toString().trim()
  } else {
    throw new CommandError('bw command failed.', commandProcess)
  }
}
