const { spawn } = require('child_process')
const { CommandError, CancelError } = require('../util/error')

const dmenuPath = process.env.DMENU_PATH || 'dmenu'

/**
 * executes a dmenu command
 * note that this command depends on user input, thus it returns a promise
 */
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
      if (status === 1) {
        reject(new CancelError(stderr.trim()))
      } else if (status !== 0) {
        reject(new CommandError('dmenu command failed.', { status, stderr, stdout: choice }))
      } else {
        // we need to remove the newline from the output, but spaces are still significant
        resolve(choice.replace(/[\r\n]$/, ''))
      }
    })
  })
