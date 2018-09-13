const path = require('path')
const { execSync } = require('child_process')
const obfuscate = require('./util/obfuscate/bitwarden-cli')

const bwExecutable = path.resolve(__dirname, '../node_modules/.bin/bw')
module.exports = args => {
  const execCommand = `${bwExecutable} ${args}`
  console.debug('$', obfuscate(execCommand))
  try {
    const stdout = execSync(execCommand)
    return stdout.toString().replace(/\n$/, '')
  } catch (e) {
    throw new Error(e.stdout.toString().trim())
  }
}
