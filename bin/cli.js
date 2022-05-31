#!/usr/bin/env node

const os = require('os')
const path = require('path')
const { exec } = require('child_process')
const minimist = require('minimist')
const packageJson = require('../package.json')
const menu = require('../src')
const obfuscateState = require('../src/util/obfuscate')
const { scheduleCleanup } = require('../src/schedule-cleanup')
const { CancelError, CommandError } = require('../src/util/error')

const BW_LIST_ARGS_DEFAULT = ''
const CACHE_PASSWORD_DEFAULT = 15
const DMENU_ARGS_DEFAULT = ''
const DMENU_PSWD_ARGS_DEFAULT = ''
const SESSION_TIMEOUT_DEFAULT = 0
const SYNC_VAULT_AFTER_DEFAULT = 0
const STDOUT_DEFAULT = false

const args = minimist(process.argv.slice(2))
if (args.help) {
  console.log(
    `bitwarden-dmenu v${packageJson.version}

Usage: bitwarden-dmenu [options]

The DMENU_PATH environment variable can be used to point to an alternative dmenu implementation. Defaults to 'dmenu'.

Options:
  --bw-list-args      Arbitrary arguments to pass to bitwarden's 'list' command
                      Defaults to nothing.
  --clear-clipboard   Number of seconds to keep selected field in the clipboard.
                      Defaults to ${CACHE_PASSWORD_DEFAULT}s.
  --dmenu-args        Sets arbitrary arguments to pass to dmenu
                      Defaults to nothing.
  --dmenu-pswd-args   Sets arbitrary arguments to pass to the dmenu password prompt
                      Defaults to nothing.
  --session-timeout   Number of seconds after an unlock that the menu can be accessed
                      without providing a password again. Defaults to ${SESSION_TIMEOUT_DEFAULT}s.
  --stdout            Prints the password and username to stdout
  --sync-vault-after  Number of seconds allowable between last bitwarden sync and
                      current time. Defaults to ${SYNC_VAULT_AFTER_DEFAULT}s.
  --on-error          Arbitrary command to run if the program fails. The thrown error
                      is piped to the given command. Defaults to none.

  --stdout            Prints the password and username to stdout

  --debug             Show extra logs useful for debugging.
  --debug-unsafe      Show debug logs WITHOUT obfuscating your sensitive info. Do not share!
`
  )
  process.exit()
}

const bwListArgs = args['bw-list-args'] || BW_LIST_ARGS_DEFAULT
const dmenuArgs = args['dmenu-args'] || DMENU_ARGS_DEFAULT
const dmenuPswdArgs = args['dmenu-pswd-args'] || DMENU_PSWD_ARGS_DEFAULT
const unsafeDebug = args['debug-unsafe']
const sessionTimeout = args['session-timeout'] || SESSION_TIMEOUT_DEFAULT
const syncVaultAfter = args['sync-vault-after'] || SYNC_VAULT_AFTER_DEFAULT
const onErrorCommand = args['on-error']
const stdout = args['stdout'] || STDOUT_DEFAULT

// prevent clipboard clearing from locking up process when printing to stdout
const clearClipboardAfter = stdout ? 0 : args['clear-clipboard'] || CACHE_PASSWORD_DEFAULT

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

const pipeErrorToCommand = (command, e) =>
  new Promise((resolve, reject) => {
    const errorCommand = exec(onErrorCommand)
    console.log(e)
    if (e instanceof CommandError) errorCommand.stdin.write(`'${e.errorMessage}'`)
    else errorCommand.stdin.write(`'${e.toString()}'`)
    errorCommand.stdin.end()
    errorCommand.on('close', status => {
      if (status === 0) resolve()
      else reject()
    })
  })

async function runBitwardenDmenu() {
  try {
    await menu({
      bwListArgs,
      dmenuArgs: dmenuArgsParsed,
      dmenuPswdArgs: dmenuPswdArgsParsed,
      saveSession,
      sessionFile,
      stdout,
      oldestAllowedVaultSync,
      unsafeDebug
    })
    return { lockBitwardenAfter: sessionTimeout, clearClipboardAfter }
  } catch (e) {
    if (e instanceof CancelError) {
      console.debug('cancelled bitwarden-dmenu early.')
      return { lockBitwardenAfter: sessionTimeout, clearClipboardAfter: null }
    } else if (onErrorCommand) await pipeErrorToCommand(onErrorCommand, e)
    else {
      console.error('an error occurred:')
      console.error(e)
    }

    return { lockBitwardenAfter: 0, clearClipboardAfter: 0 }
  }
}

;(async () => {
  const { lockBitwardenAfter, clearClipboardAfter } = await runBitwardenDmenu()

  await scheduleCleanup({
    lockBitwardenAfter,
    clearClipboardAfter,
    sessionFile,
    stdout
  })
})()
