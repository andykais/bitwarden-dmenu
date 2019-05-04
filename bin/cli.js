#!/usr/bin/env node

const os = require('os')
const path = require('path')
const { exec } = require('child_process')
const minimist = require('minimist')
const menu = require('../src')
const obfuscateState = require('../src/util/obfuscate')
const scheduleCleanup = require('../src/schedule-cleanup')

const bwListArgsDefault = ''
const cachePasswordDefault = 15
const dmenuArgsDefault = ''
const dmenuPswdArgsDefault = ''
const lengthDefault = 0
const sessionTimeoutDefault = 0
const syncVaultAfterDefault = 0
const stdoutDefault = false

const args = minimist(process.argv.slice(2))
if (args.help) {
  console.log(
    `Usage: bitwarden-dmenu [options]

The DMENU_PATH environment variable can be used to point to an alternative dmenu implementation. Defaults to 'dmenu'.

Options:
  --bw-list-args      Arbitrary arguments to pass to bitwarden's 'list' command
                      Defaults to nothing.
  --clear-clipboard   Number of seconds to keep selected field in the clipboard.
                      Defaults to ${cachePasswordDefault}s.
  --dmenu-args        Sets arbitrary arguments to pass to dmenu
                      Defaults to nothing.
  --dmenu-pswd-args   Sets arbitrary arguments to pass to the dmenu password prompt
                      Defaults to nothing.
  --session-timeout   Number of seconds after an unlock that the menu can be accessed
                      without providing a password again. Defaults to ${sessionTimeoutDefault}s.
  --stdout            Prints the password and username to stdout
  --sync-vault-after  Number of seconds allowable between last bitwarden sync and
                      current time. Defaults to ${syncVaultAfterDefault}s.
  --on-error          Arbitrary command to run if the program fails. The thrown error
                      is piped to the given command. Defaults to none.
  
  --debug             Show extra logs useful for debugging.
  --debug-unsafe      Show debug logs WITHOUT obfuscating your sensitive info. Do not share!
`
  )
  process.exit()
}

const bwListArgs = args['bw-list-args'] || bwListArgsDefault
const dmenuArgs = args['dmenu-args'] || dmenuArgsDefault
const dmenuPswdArgs = args['dmenu-pswd-args'] || dmenuPswdArgsDefault
const unsafeDebug = args['debug-unsafe']
const length = args['l'] || lengthDefault
const sessionTimeout = args['session-timeout'] || sessionTimeoutDefault
const syncVaultAfter = args['sync-vault-after'] || syncVaultAfterDefault
const onErrorCommand = args['on-error']
const stdout = args['stdout'] || stdoutDefault

// prevent clipboard clearing from locking up process when printing to stdout
const clearClipboardAfter = stdout ? 0 : args['clear-clipboard'] || cachePasswordDefault

console.debug =
  args['debug'] || args['debug-unsafe'] ? (...msgs) => console.log(...msgs, '\n') : () => {}

console.info = args['stdout'] ? () => {} : console.info

if (args['debug-unsafe']) obfuscateState.turnOff()

const oldestAllowedVaultSync = syncVaultAfter
const saveSession = Boolean(sessionTimeout)
const sessionFile = path.resolve(os.tmpdir(), 'bitwarden-session.txt')

const dmenuArgsParsed = dmenuArgs ? dmenuArgs.split(/\s+/) : []
const dmenuPswdArgsParsed = ['-p', 'Password:', '-nf', 'black', '-nb', 'black'].concat(
  dmenuPswdArgs ? dmenuPswdArgs.split(/\s+/) : []
)

menu({
  bwListArgs,
  dmenuArgs: dmenuArgsParsed,
  dmenuPswdArgs: dmenuPswdArgsParsed,
  saveSession,
  sessionFile,
  stdout,
  oldestAllowedVaultSync,
  unsafeDebug
})
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
    }).catch(e => {
      // simply log an error with cleanup
      console.error(e)
      if (onErrorCommand) {
        const errorCommand = exec(onErrorCommand)
        errorCommand.stdin.write(`'${e.toString()}'`)
        errorCommand.stdin.end()
      }
    })
  })
