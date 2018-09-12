const path = require('path')
const { execSync } = require('child_process')

const bwExecutable = path.resolve(__dirname, '../node_modules/.bin/bw')
module.exports = args => {
  try {
    const stdout = execSync(`${bwExecutable} ${args}`)
    return stdout.toString().replace(/\n$/, '')
  } catch (e) {
    throw new Error(e.stdout.toString().trim())
  }
}
