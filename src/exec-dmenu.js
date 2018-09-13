const { exec, execSync, spawn } = require('child_process')

module.exports = (choices = '\n', args = '') =>
  new Promise((resolve, reject) => {
    let choice = ''
    const error = []

    const execCommand = `dmenu ${args}`
    console.debug('$', execCommand)
    const dmenu = exec(execCommand)
    dmenu.stdin.write(choices)
    dmenu.stdin.end()

    dmenu.stdout.on('data', data => {
      choice += data
    })
    dmenu.stderr.on('data', data => {
      error.push(data)
    })
    dmenu.on('close', code => {
      if (code !== 0) reject(Buffer.concat(error).toString())
      else resolve(choice.replace(/\n$/, ''))
    })
  })
