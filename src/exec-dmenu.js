const { spawn } = require('child_process')

const dmenuPath = process.env.DMENU_PATH || 'dmenu'

module.exports = (...args) => choices =>
  new Promise((resolve, reject) => {
    const execCommand = `${dmenuPath} ${args.join(' ')}`
    console.debug('$', execCommand)

    const dmenu = spawn(dmenuPath, args)
    dmenu.stdin.write(choices)
    dmenu.stdin.end()

    let choice = ''
    let stderr = ''
    dmenu.stdout.on('data', data => {
      choice += data
    })
    dmenu.stderr.on('data', data => {
      stderr += data
    })
    dmenu.on('close', status => {
      if (status !== 0) reject(new Error(stderr.trim()))
      else resolve(choice.trim())
    })
  })
