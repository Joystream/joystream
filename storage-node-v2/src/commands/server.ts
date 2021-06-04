import { Command, flags } from '@oclif/command'
import { createServer } from '../services/webApi/server'

// TODO: fix command not found error (error handling)
// TODO: custom IP address?
// TODO: parameters for --dev or key file

export default class Server extends Command {
  static description = 'Starts the storage node server.'

  static flags = {
    help: flags.help({ char: 'h' }),
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
    uploads: flags.string({
      char: 'u',
      required: true,
      description: 'Data uploading directory.',
    }),
    port: flags.integer({
      char: 'p',
      required: true,
      description: 'Server port.',
    }),
  }

  static args = [{ name: 'file' }]

  async run(): Promise<void> {
    const { flags } = this.parse(Server)

    try {
      const port = flags.port
      const server = await createServer(flags.dev, flags.uploads)
      console.info(`Listening on http://localhost:${port}`)
      server.listen(port)
    } catch (err) {
      console.error(`Error: ${err}`)
    }
  }
}
