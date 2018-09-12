const fs = require('fs')
const bwRun = require('./exec-bitwarden-cli')
const clipboardy = require('clipboardy')

const timeout = n => new Promise(resolve => setTimeout(resolve, n))

/*
 * timeouts in seconds
 *
 */

module.exports = ({ lockBitwardenAfter, clearClipboardAfter, sessionFile }) =>
  Promise.all([
    timeout(lockBitwardenAfter * 1000).then(() => {
      try {
        fs.unlinkSync(sessionFile)
        console.log(`${sessionFile} removed.`)
      } catch (e) {
        if (e.code !== 'ENOENT') throw e
        console.log(`${sessionFile} already removed.`)
      }
      bwRun('lock')
      console.log('bitwarden is locked.')
    }),
    timeout(clearClipboardAfter * 1000).then(() => {
      clipboardy.writeSync('')
      console.log('clipboard is cleared.')
    })
  ])
