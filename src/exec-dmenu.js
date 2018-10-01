const { exec } = require('child_process')

module.exports = (...args) => choices =>
  new Promise((resolve, reject) => {
    let choice = ''
    let dmenu_path = process.env.DMENU_PATH
    const error = []

    // Use a default of 'dmenu' if not specified in process.env
    const dmenu_binary = (typeof dmenu_path === 'undefined') ? 'dmenu' : dmenu_path;
    const execCommand = `${dmenu_binary} ${args}`
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
