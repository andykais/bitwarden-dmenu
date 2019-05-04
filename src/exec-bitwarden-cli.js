const path = require('path')
const { spawnSync } = require('child_process')
const obfuscate = require('./util/obfuscate/bitwarden-cli')

const bwExecutable = path.resolve(__dirname, '../node_modules/.bin/bw')
module.exports = (...args) => {
  const execCommand = `${bwExecutable} ${args.join(' ')}`
  console.debug('$', obfuscate(execCommand))
  const { stdout, status } = spawnSync(bwExecutable, args)
  if (status !== 0) {
    throw new Error(`bw: "${stdout.toString().trim()}"`)
  }
  return stdout.toString().replace(/\n$/, '')
}
