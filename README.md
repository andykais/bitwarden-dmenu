# bitwarden-dmenu

[![npm](https://img.shields.io/npm/v/bitwarden-dmenu.svg)](https://www.npmjs.com/package/bitwarden-dmenu)
[![node](https://img.shields.io/node/v/bitwarden-dmenu.svg)](http://npmjs.com/package/bitwarden-dmenu)
[![GitHub](https://img.shields.io/github/license/andykais/bitwarden-dmenu.svg)](https://github.com/andykais/bitwarden-dmenu/blob/master/LICENSE)

dmenu for [bitwarden](https://bitwarden.com/) which can copy usernames, passwords, and various fields to your
clipboard.

## Usage

```
$ bitwarden-dmenu --help
Usage: bitwarden-dmenu [options]

The DMENU_PATH environment variable can be used to point to an alternative dmenu implementation. Defaults to 'dmenu'.

Options:
  --bw-list-args      Arbitrary arguments to pass to bitwarden's 'list' command
                      Defaults to nothing.
  --clear-clipboard   Number of seconds to keep selected field in the clipboard.
                      Defaults to 15s.
  --dmenu-args        Sets arbitrary arguments to pass to dmenu
                      Defaults to nothing.
  --dmenu-pswd-args   Sets arbitrary arguments to pass to the dmenu password prompt
                      Defaults to nothing.
  --session-timeout   Number of seconds after an unlock that the menu can be accessed
                      without providing a password again. Defaults to 0s.
  --stdout            Prints the password and username to stdout
  --sync-vault-after  Number of seconds allowable between last bitwarden sync and
                      current time. Defaults to 0s.
  --on-error          Arbitrary command to run if the program fails. The thrown error
                      is piped to the given command. Defaults to none.

  --stdout            Prints the password and username to stdout

  --debug             Show extra logs useful for debugging.
  --debug-unsafe      Show debug logs WITHOUT obfuscating your sensitive info. Do not share!
```

By default, this program runs at its most secure. No session is stored for any time period, the vault is updated
every time it is used, and the clipboard is cleared every 15 seconds. In reality, you may want something a
little more lenient. Here is the command I use in my personal i3wm config.

```bash
bitwarden-dmenu --dmenu-args '-i' --clear-clipboard 30 --session-timeout 100 --sync-vault-after 3600 --on-error 'xargs notify-send --urgency=low'
```

`bitwarden-dmenu` will prompt for a login if you are logged out.

## Installation

```bash
npm i -g bitwarden-dmenu
```

## Depends On

[dmenu](https://tools.suckless.org/dmenu/)

## Credits

Inspired by the (now) deprecated [keepass-dmenu](https://github.com/gustavnikolaj/keepass-dmenu)
