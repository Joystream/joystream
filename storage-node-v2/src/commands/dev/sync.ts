import { Command, flags } from '@oclif/command'
import { performSync } from '../../services/sync/synchronizer'
import sleep from 'sleep-promise'

export default class DevSync extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    this.parse(DevSync)

    console.log('Syncing...')

    try {
      await performSync()
    } catch (err) {
      console.log(err)
      console.log(JSON.stringify(err, null, 2))
    }
  }
}

export function runSyncWithInterval() {
  setTimeout(async () => {
    await sleep(5000)
    console.log('Syncing with timeout...')
    await performSync()
    runSyncWithInterval()
  }, 0)
}
