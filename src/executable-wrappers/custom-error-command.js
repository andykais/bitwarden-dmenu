const { exec } = require('child_process')
const { CommandError } = require('../util/error')

const pipeToCommand = (command, string) =>
  new Promise((resolve, reject) => {
    const errorCommand = exec(onErrorCommand)
    let stderr = ''

    errorCommand.stdin.write(`'${e.toString()}'`)
    errorCommand.stdin.end()
    errorCommand.stderr.on('data', data => {
      stderr += data.toString()
    })
    errorCommand.on('close', status => {
      if (status === 0) {
        resolve()
      } else {
        const commandInfo = { status, stdout: '', stderr }
        reject(new CommandError(`custom command '${command}' failed.`, commandInfo))
      }
    })
  })
