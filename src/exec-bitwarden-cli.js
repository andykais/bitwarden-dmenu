const path = require('path')
const { spawnSync } = require('child_process')
const obfuscate = require('./util/obfuscate/bitwarden-cli')

const bwExecutable = path.resolve(__dirname, '../node_modules/.bin/bw')
module.exports = (...args) => {
  const execCommand = `${bwExecutable} ${args.join(' ')}`
  console.debug('$', obfuscate(execCommand))
  try {
    const { stdout } = spawnSync(bwExecutable, args)
    return stdout.toString().replace(/\n$/, '')
  } catch (e) {
    throw new Error(e.stdout.toString().trim())
  }
}
