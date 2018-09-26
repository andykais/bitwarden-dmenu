#!/usr/bin/env node

const os = require('os')
const path = require('path')
const { exec } = require('child_process')
const minimist = require('minimist')
const menu = require('../src')
const scheduleCleanup = require('../src/schedule-cleanup')

const cachePasswordDefault = 15
const sessionTimeoutDefault = 0
const syncVaultAfterDefault = 0
const args = minimist(process.argv.slice(2))
if (args.help) {
  console.log(
    `Usage: bitwarden-dmenu [options]

Options:
  --clear-clipboard   Number of seconds to keep selected field in the clipboard.
                      Defaults to ${cachePasswordDefault}s.
  --session-timeout   Number of seconds after an unlock that the menu can be accessed
                      without providing a password again. Defaults to ${sessionTimeoutDefault}s.
  --sync-vault-after  Number of seconds allowable between last bitwarden sync and
                      current time. Defaults to ${syncVaultAfterDefault}s.
  --on-error          Arbitrary command to run if the program fails. The thrown error
                      is piped to the given command. Defaults to none.

  --verbose           Show extra logs useful for debugging.
`
  )
  process.exit()
}

const clearClipboardAfter = args['clear-clipboard'] || cachePasswordDefault
const sessionTimeout = args['session-timeout'] || sessionTimeoutDefault
const syncVaultAfter = args['sync-vault-after'] || syncVaultAfterDefault
const onErrorCommand = args['on-error']
console.debug = args['verbose']
  ? (...msgs) => console.log(...msgs, '\n')
  : () => {}

const oldestAllowedVaultSync = syncVaultAfter
const saveSession = Boolean(sessionTimeout)
const sessionFile = path.resolve(os.tmpdir(), 'bitwarden-session.txt')

menu({ saveSession, sessionFile, oldestAllowedVaultSync })
  .then(() =>
    scheduleCleanup({
      lockBitwardenAfter: sessionTimeout,
      clearClipboardAfter,
      sessionFile
    })
  )
  .catch(e => {
    console.error(e)
    // if something goes wrong, immediately clear the clipboard & lock bitwarden,
    // then run error command
    scheduleCleanup({
      lockBitwardenAfter: 0,
      clearClipboardAfter: 0,
      sessionFile
    })
      .catch(e => {
        // simply log a secondary error
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
