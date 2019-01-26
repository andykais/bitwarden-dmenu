#!/usr/bin/env node

const os = require('os')
const path = require('path')
const { exec } = require('child_process')
const minimist = require('minimist')
const menu = require('../src')
const scheduleCleanup = require('../src/schedule-cleanup')

const cachePasswordDefault = 15
const lengthDefault = 0
const sessionTimeoutDefault = 0
const syncVaultAfterDefault = 0
const stdoutDefault = false
const urlFilterDefault = null

const args = minimist(process.argv.slice(2))
if (args.help) {
  console.log(
    `Usage: bitwarden-dmenu [options]

The DMENU_PATH environment variable can be used to point to an alternative dmenu implementation. Defaults to 'dmenu'.

Options:
  --clear-clipboard   Number of seconds to keep selected field in the clipboard.
                      Defaults to ${cachePasswordDefault}s.
  -l                  Sets the -l parameter value passed to dmenu.
                      Defaults to ${lengthDefault}
  --session-timeout   Number of seconds after an unlock that the menu can be accessed
                      without providing a password again. Defaults to ${sessionTimeoutDefault}s.
  --stdout            Prints the password and username to stdout
  --sync-vault-after  Number of seconds allowable between last bitwarden sync and
                      current time. Defaults to ${syncVaultAfterDefault}s.
  --on-error          Arbitrary command to run if the program fails. The thrown error
                      is piped to the given command. Defaults to none.
  --url               Url to filter by.
  
  --verbose           Show extra logs useful for debugging.
`
  )
  process.exit()
}

const clearClipboardAfter = args['clear-clipboard'] || cachePasswordDefault
const length = args['l'] || lengthDefault
const sessionTimeout = args['session-timeout'] || sessionTimeoutDefault
const syncVaultAfter = args['sync-vault-after'] || syncVaultAfterDefault
const onErrorCommand = args['on-error']
const stdout = args['stdout'] || stdoutDefault
const urlFilter = args['url'] || urlFilterDefault

console.debug = args['verbose']
  ? (...msgs) => console.log(...msgs, '\n')
  : () => {}

const oldestAllowedVaultSync = syncVaultAfter
const saveSession = Boolean(sessionTimeout)
const sessionFile = path.resolve(os.tmpdir(), 'bitwarden-session.txt')

menu({ length, saveSession, sessionFile, stdout, oldestAllowedVaultSync, urlFilter })
  .then(() =>
    scheduleCleanup({
      lockBitwardenAfter: sessionTimeout,
      clearClipboardAfter,
      sessionFile,
      stdout
    })
  )
  .catch(e => {
    console.error(e)
    // if something goes wrong, immediately clear the clipboard & lock bitwarden,
    // then run error command
    scheduleCleanup({
      lockBitwardenAfter: 0,
      clearClipboardAfter: 0,
      sessionFile,
      stdout
    })
      .catch(e => {
        // simply log an error with cleanup
        console.error(e)
      })
      .then(() => {
        if (onErrorCommand) {
          const errorCommand = exec(onErrorCommand)
          errorCommand.stdin.write(`'${e.toString()}'`)
          errorCommand.stdin.end()
        }
      })
  })
