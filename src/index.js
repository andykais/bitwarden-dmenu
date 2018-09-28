const { existsSync, writeFileSync, readFileSync } = require('fs')
const clipboardy = require('clipboardy')
const dmenuRun = require('./exec-dmenu')
const bwRun = require('./exec-bitwarden-cli')
const obfuscate = require('./util/obfuscate/object')

// get a session token, either from existing sessionFile or by `bw unlock [password]`
const getSessionVar = async ({ saveSession, sessionFile }) => {
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
      const password = await dmenuRun('-p Password: -nf black -nb black')('\n')
      if (!password) throw new Error('no password given!')
      const session = bwRun('unlock', password, '--raw')
      writeFileSync(sessionFile, session)
      console.debug('saved new session file.')
      return session
    }
  } else {
    const password = await dmenuRun('-p Password: -nf black -nb black')('\n')
    if (!password) throw new Error('no password given!')
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
const getAccounts = ({ session }) => {
  const listStr = bwRun('list', 'items', `--session=${session}`)
  const list = JSON.parse(listStr)
  return list
}

// choose one account with dmenu
const chooseAccount = async ({ list }) => {
  const LOGIN_TYPE = 1
  const accountNames = list
    .filter(a => a.type === LOGIN_TYPE)
    .map(a => `${a.name}: ${a.login.username}`)
  // -i allows case insensitive matching
  const selected = await dmenuRun('-i')(accountNames.join('\n'))
  const index = accountNames.indexOf(selected)
  const selectedAccount = list[index]
  console.debug('selected account:\n', obfuscate(selectedAccount))
  return selectedAccount
}

// choose one field with dmenu
const chooseField = async ({ selectedAccount }) => {
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
  const field = await dmenuRun()(Object.keys(copyable).join('\n'))
  console.debug(`selected field '${field}'`)
  const valueToCopy = copyable[field]
  return valueToCopy
}

module.exports = async ({
  saveSession,
  sessionFile,
  oldestAllowedVaultSync
}) => {
  const session = await getSessionVar({ saveSession, sessionFile })

  // bw sync if necessary
  syncIfNecessary({ session, oldestAllowedVaultSync })

  // bw list
  const list = getAccounts({ session })

  // choose account in dmenu
  const selectedAccount = await chooseAccount({ list })

  // choose field to copy in dmenu
  const valueToCopy = await chooseField({ selectedAccount })

  // copy to clipboard
  clipboardy.writeSync(valueToCopy)
}
