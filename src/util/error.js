class CommandError extends Error {
  constructor(message, { status, stderr, stdout }) {
    super(message)
    this.status = status
    this.stdout = stdout.toString().trim()
    this.stderr = stderr.toString().trim()
  }
}

module.exports = {
  CommandError
}
