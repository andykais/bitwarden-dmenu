const { existsSync, writeFileSync, readFileSync } = require('fs')
const dmenuRun = require('./exec-dmenu')
const bwRun = require('./exec-bitwarden-cli')
const clipboardy = require('clipboardy')

const getSessionVar = async ({ saveSession, sessionFile }) => {
  if (saveSession) {
    const sessionFileExists = existsSync(sessionFile)

    if (sessionFileExists) {
      const session = readFileSync(sessionFile)
        .toString()
        .replace(/\n$/, '')
      return session
    } else {
      // prompt for password in dmenu
      const password = await dmenuRun('\n', '-p Password: -nf black -nb black')
      if (!password) throw new Error('no password given!')
      const session = bwRun(`unlock '${password}' --raw`)
      writeFileSync(sessionFile, session)
      return session
    }
  } else {
    const password = await dmenuRun('\n', '-p Password: -nf black -nb black')
    if (!password) throw new Error('no password given!')
    const session = bwRun(`unlock '${password}' --raw`)
    return session
  }
}

module.exports = async ({
  saveSession,
  sessionFile,
  oldestAllowedVaultSync
}) => {
  const session = await getSessionVar({ saveSession, sessionFile })
  console.log({ session })

  // bw sync if necessary
  const last = bwRun(`sync --last --session=${session}`)
  const timeSinceSync = (new Date().getTime() - new Date(last).getTime()) / 1000
  if (timeSinceSync > oldestAllowedVaultSync) {
    bwRun(`sync --session=${session}`)
  }
  console.log('synced')

  // bw list
  const listStr = bwRun(`list items --session=${session}`)
  const list = JSON.parse(listStr)
  const accountNames = list.map(a => `${a.name}: ${a.login.username}`)

  // choose account in dmenu
  const selected = await dmenuRun(accountNames.join('\n'))
  const index = accountNames.indexOf(selected)
  const selectedAccount = list[index]

  // choose field to copy in dmenu
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
  const field = await dmenuRun(Object.keys(copyable).join('\n'))
  const valueToCopy = copyable[field]

  // copy to clipboard
  clipboardy.writeSync(valueToCopy)
}
