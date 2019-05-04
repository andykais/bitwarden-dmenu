const { existsSync, writeFileSync, readFileSync } = require('fs')
const clipboardy = require('clipboardy')
const dmenuRun = require('./exec-dmenu')
const bwRun = require('./exec-bitwarden-cli')
const obfuscate = require('./util/obfuscate/object')
const packageJson = require('../package.json')

// get a session token, either from existing sessionFile or by `bw unlock [password]`
const getSessionVar = async ({ dmenuPswdArgs, saveSession, sessionFile }) => {
  if (saveSession) {
    console.debug(`checking for session file at ${sessionFile}`)
    const sessionFileExists = existsSync(sessionFile)

    if (sessionFileExists) {
      const session = readFileSync(sessionFile)
        .toString()
        .replace(/\n$/, '')
      console.debug('read existing session file.')
      return session
    } else {
      console.debug('no session file found.')
      // prompt for password in dmenu
      const password = await dmenuRun(`-p Password: -nf black -nb black ${dmenuPswdArgs}`)('\n')
      if (!password.length) throw new Error('no password given!')
      const session = bwRun('unlock', password, '--raw')
      writeFileSync(sessionFile, session)
      console.debug('saved new session file.')
      return session
    }
  } else {
    // Why doesn't dmenuRun('...', dmenuPswdArgs)('\n') work here?
    const password = await dmenuRun(`-p Password: -nf black -nb black ${dmenuPswdArgs}`)('\n')
    if (!password.length) throw new Error('no password given!')
    const session = bwRun('unlock', password, '--raw')
    return session
  }
}

// sync the password accounts with the remote server
// if --sync-vault-after < time since the last sync
const syncIfNecessary = ({ session, oldestAllowedVaultSync }) => {
  const last = bwRun('sync', '--last', `--session=${session}`)
  const timeSinceSync = (new Date().getTime() - new Date(last).getTime()) / 1000
  if (timeSinceSync > oldestAllowedVaultSync) {
    console.debug('syncing vault...')
    bwRun('sync', `--session=${session}`)
    console.debug(`sync complete, last sync was ${last}`)
  }
}

// get the list all password accounts in the vault
const getAccounts = ({ session, bwListArgs }) => {
  const listStr = bwRun('list', 'items', bwListArgs, `--session=${session}`)
  const list = JSON.parse(listStr)
  return list
}

// choose one account with dmenu
const chooseAccount = async ({ list, dmenuArgs }) => {
  const LOGIN_TYPE = 1
  const loginList = list.filter(a => a.type === LOGIN_TYPE)

  const accountNames = loginList.map(a => `${a.name}: ${a.login.username}`)
  const selected = await dmenuRun(dmenuArgs)(accountNames.join('\n'))
  const index = accountNames.indexOf(selected)
  // accountNames indexes match loginList indexes
  const selectedAccount = loginList[index]
  console.debug('selected account:\n', obfuscate(selectedAccount))
  return selectedAccount
}

// choose one field with dmenu
const chooseField = async ({ selectedAccount, dmenuArgs }) => {
  if (!selectedAccount) throw new Error('no account selected!')
  const copyable = {
    password: selectedAccount.login.password,
    username: selectedAccount.login.username,
    notes: selectedAccount.notes,
    ...(selectedAccount.fields || []).reduce(
      (acc, f) => ({
        ...acc,
        ['custom.' + f.name]: f.value
      }),
      {}
    )
  }
  const field = await dmenuRun(dmenuArgs)(Object.keys(copyable).join('\n'))
  console.debug(`selected field '${field}'`)
  const valueToCopy = copyable[field]
  return valueToCopy
}

module.exports = async ({
  bwListArgs,
  dmenuArgs,
  dmenuPswdArgs,
  saveSession,
  sessionFile,
  stdout,
  oldestAllowedVaultSync
}) => {
  console.debug(`bitwarden-dmenu v${packageJson.version}`)
  const session = await getSessionVar({ dmenuPswdArgs, saveSession, sessionFile })

  // bw sync if necessary
  syncIfNecessary({ session, oldestAllowedVaultSync })

  // bw list
  const list = getAccounts({ session, bwListArgs })

  // choose account in dmenu
  const selectedAccount = await chooseAccount({ list, dmenuArgs })

  if (stdout) {
    console.log(`${selectedAccount.login.username}\n${selectedAccount.login.password}`)
  } else {
    // choose field to copy in dmenu
    const valueToCopy = await chooseField({ selectedAccount, dmenuArgs })

    // copy to clipboard
    clipboardy.writeSync(valueToCopy)
  }
}
