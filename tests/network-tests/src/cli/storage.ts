import path from 'path'
import { CLI } from './base'
import { spawn } from 'child_process'
import { v4 as uuid } from 'uuid'
import { WorkerId } from '@joystream/types/working-group'
import os from 'os'
import { ProcessManager } from './utils'
import fs from 'fs'

const CLI_ROOT_PATH = path.resolve(__dirname, '../../../../storage-node-v2')

export class StorageCLI extends CLI {
  constructor(defaultSuri?: string) {
    super(CLI_ROOT_PATH, undefined, defaultSuri ? ['--accountUri', defaultSuri] : [])
  }

  setDefaultSuri(defaultSuri: string): void {
    this.defaultArgs = ['--accountUri', defaultSuri]
  }

  async spawnServer(
    operatorId: number | WorkerId,
    port = 3333,
    sync = true,
    syncInterval = 1
  ): Promise<ProcessManager> {
    const queryNodeHost = new URL(process.env.QUERY_NODE_URL || '').host
    const apiUrl = new URL(process.env.NODE_URL || '').toString()
    const uploadsDir = path.join(os.tmpdir(), uuid())
    fs.mkdirSync(uploadsDir)
    const { env } = this
    const args = [
      ...this.defaultArgs,
      '--worker',
      operatorId.toString(),
      '--port',
      port.toString(),
      '--queryNodeHost',
      queryNodeHost,
      '--apiUrl',
      apiUrl,
      '--uploads',
      uploadsDir,
    ]
    if (sync) {
      args.push('--sync')
      args.push('--syncInterval')
      args.push(syncInterval.toString())
    }
    const serverProcess = spawn(this.binPath, ['server', ...args], { env, cwd: this.rootPath })
    const serverListener = new ProcessManager('Storage node server', serverProcess, 'stderr')
    await serverListener.untilOutput('Listening')
    return serverListener
  }
}
