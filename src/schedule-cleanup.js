const fs = require('fs')
const bwRun = require('./executable-wrappers/bitwarden-cli')
const clipboardy = require('clipboardy')

/**
 * timeouts in seconds
 */
const timeout = n => new Promise(resolve => setTimeout(resolve, n))

/**
 * Locks bitwarden (require password access) and removes session.txt file containing session id.
 */
const lockBitwarden = async ({ lockBitwardenAfter, sessionFile }) => {
  console.debug(`scheduled bitwarden to lock after ${lockBitwardenAfter} seconds`)
  await timeout(lockBitwardenAfter * 1000)

  try {
    fs.unlinkSync(sessionFile)
    console.debug(`${sessionFile} removed.`)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
    console.debug(`${sessionFile} already removed.`)
  }
  bwRun('lock')
  console.info('bitwarden is locked.')
}

/**
 * Clears clipboard after specified time.
 * Note that if new text is put into the clipboard, this will also be cleared after the timeout
 */
const clearClipboard = async ({ clearClipboardAfter, stdout }) => {
  if (clearClipboardAfter === null) return

  console.debug(`scheduled clipboard to clear after ${clearClipboardAfter} seconds`)
  await timeout(clearClipboardAfter * 1000)

  if (!stdout) {
    clipboardy.writeSync('')
    console.info('clipboard is cleared.')
  }
}

const scheduleCleanup = args => {
  console.debug('begin cleanup')
  return Promise.all([lockBitwarden(args), clearClipboard(args)])
}

module.exports = {
  scheduleCleanup
}
