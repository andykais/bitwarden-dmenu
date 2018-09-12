# bitwarden-dmenu

[bitwarden](https://bitwarden.com/) client using dmenu

## Depends on
- [dmenu](https://tools.suckless.org/dmenu/)
- [bitwarden-cli](https://help.bitwarden.com/article/cli/)

## Installation
```bash
# login with bitwarden-cli once before using bitwarden-dmenu
bw login
# install the cli
npm i -g bitwarden-dmenu
```

## Usage
```
$ bitwarden-dmenu --help
Usage: bitwarden-dmenu [options]

Options:
  --clear-clipboard   Number of seconds to keep selected field in the clipboard.
                      Defaults to 15s.
  --session-timeout   Number of seconds after an unlock that the menu can be accessed
                      without providing a password again. Defaults to 0s.
  --sync-vault-after  Number of seconds allowable between last bitwarden sync and
                      current time. Defaults to 0s.
  --on-error          Arbitrary command to run if the program fails. Defaults to none.

```
