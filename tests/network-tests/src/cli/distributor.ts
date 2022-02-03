import path from 'path'
import { spawn } from 'child_process'
import { DistributorNodeConfiguration } from '@joystream/distributor-cli/src/types/generated/ConfigJson'
import { CLI, CommandResult } from './base'
import { WorkerId } from '@joystream/types/working-group'
import { ProcessManager } from './utils'
import Keyring from '@polkadot/keyring'

const CLI_ROOT_PATH = path.resolve(__dirname, '../../../../distributor-node')

export class DistributorCLI extends CLI {
  protected keys: string[]

  constructor(keyUris: string[]) {
    const keys: DistributorNodeConfiguration['keys'] = keyUris.map((suri) => ({
      suri,
    })) as DistributorNodeConfiguration['keys']
    const defaultEnv = {
      JOYSTREAM_DISTRIBUTOR__KEYS: JSON.stringify(keys),
    }
    super(CLI_ROOT_PATH, defaultEnv)
    const keyring = new Keyring({ type: 'sr25519' })
    keyUris.forEach((uri) => keyring.addFromUri(uri))
    this.keys = keyring.getPairs().map((p) => p.address)
  }

  async run(command: string, customArgs: string[] = [], keyLocks?: string[]): Promise<CommandResult> {
    return super.run(command, customArgs, keyLocks || this.keys)
  }

  async spawnServer(
    operatorId: number | WorkerId,
    port = 3334,
    buckets: number[] | 'all' = 'all'
  ): Promise<ProcessManager> {
    const { env } = this
    const serverEnv = {
      ...env,
      JOYSTREAM_DISTRIBUTOR__PORT: port.toString(),
      JOYSTREAM_DISTRIBUTOR__WORKER_ID: operatorId.toString(),
      JOYSTREAM_DISTRIBUTOR__BUCKETS: buckets === 'all' ? 'all' : JSON.stringify(buckets),
    }
    const serverProcess = spawn(this.binPath, ['start'], { env: serverEnv, cwd: this.rootPath })
    const serverManager = new ProcessManager('Distributor node server', serverProcess, 'stdout')
    await serverManager.untilOutput(`listening on port ${port}`)
    return serverManager
  }
}
