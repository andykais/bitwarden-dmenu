class CommandError extends Error {
  constructor(message, commandProcess) {
    super(message)
    const { status, stderr, stdout } = commandProcess
    this.status = status
    this.stdout = stdout ? stdout.toString().trim() : ''
    this.stderr = stderr ? stderr.toString().trim() : ''
    this.commandProcess = commandProcess
  }

  get errorMessage() {
    return this.stdout || this.stderr || this.message
  }
}

/**
 * called when a user hits Escape during a dmenu command.
 * This isnt really an error so we want to handle it gracefully and silently
 */
class CancelError extends Error {}

module.exports = {
  CommandError,
  CancelError
}
