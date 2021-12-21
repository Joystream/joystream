import { SubmittableResult } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { QueryNodeApi } from './sumer-query-node/api'
import { RuntimeApi } from '../RuntimeApi'
import { Keyring } from '@polkadot/keyring'
import path from 'path'
import nodeCleanup from 'node-cleanup'
import _ from 'lodash'
import fs from 'fs'

export type MigrationResult = {
  idsMap: Map<number, number>
  failedMigrations: number[]
}

export type MigrationStateJson = {
  idsMapEntries: [number, number][]
  failedMigrations: number[]
}

export type BaseMigrationConfig = {
  migrationStatePath: string
  sudoUri: string
}

export type BaseMigrationParams = {
  api: RuntimeApi
  queryNodeApi: QueryNodeApi
  config: BaseMigrationConfig
}

export abstract class BaseMigration {
  abstract readonly name: string
  protected api: RuntimeApi
  protected queryNodeApi: QueryNodeApi
  protected sudo!: KeyringPair
  protected config: BaseMigrationConfig
  protected failedMigrations: Set<number>
  protected idsMap: Map<number, number>

  public constructor({ api, queryNodeApi, config }: BaseMigrationParams) {
    this.api = api
    this.queryNodeApi = queryNodeApi
    this.config = config
    this.failedMigrations = new Set()
    this.idsMap = new Map()
    fs.mkdirSync(config.migrationStatePath, { recursive: true })
  }

  protected getMigrationStateFilePath(): string {
    const { migrationStatePath } = this.config
    return path.join(migrationStatePath, `${_.camelCase(this.name)}.json`)
  }

  public async init(): Promise<void> {
    this.loadMigrationState()
    nodeCleanup(() => this.saveMigrationState())
    await this.loadSudoKey()
  }

  public abstract run(): Promise<MigrationResult>

  protected getMigrationStateJson(): MigrationStateJson {
    return {
      idsMapEntries: Array.from(this.idsMap.entries()),
      failedMigrations: Array.from(this.failedMigrations),
    }
  }

  protected loadMigrationState(): void {
    const stateFilePath = this.getMigrationStateFilePath()
    if (fs.existsSync(stateFilePath)) {
      const migrationStateJson = fs.readFileSync(stateFilePath).toString()
      const migrationState: MigrationStateJson = JSON.parse(migrationStateJson)
      this.idsMap = new Map(migrationState.idsMapEntries)
    }
  }

  protected saveMigrationState(): void {
    const stateFilePath = this.getMigrationStateFilePath()
    const migrationState = this.getMigrationStateJson()
    fs.writeFileSync(stateFilePath, JSON.stringify(migrationState, undefined, 2))
  }

  private async loadSudoKey() {
    const { sudoUri } = this.config
    const keyring = new Keyring({ type: 'sr25519' })
    this.sudo = keyring.createFromUri(sudoUri)
    const sudoKey = await this.api.query.sudo.key()
    if (sudoKey.toString() !== this.sudo.address) {
      throw new Error(`Invalid sudo key! Expected: ${sudoKey.toString()}, Got: ${this.sudo.address}`)
    }
  }

  protected extractFailedSudoAsMigrations<T extends { id: string }>(result: SubmittableResult, batch: T[]): void {
    const { api } = this
    const sudoAsDoneEvents = api.findEvents(result, 'sudo', 'SudoAsDone')
    if (sudoAsDoneEvents.length !== batch.length) {
      throw new Error(`Could not extract failed migrations from: ${JSON.stringify(result.toHuman())}`)
    }
    const failedIds: number[] = []
    sudoAsDoneEvents.forEach(({ data: [sudoAsDone] }, i) => {
      if (sudoAsDone.isFalse) {
        const id = parseInt(batch[i].id)
        failedIds.push(id)
        this.failedMigrations.add(id)
      }
    })
    if (failedIds.length) {
      console.error(`Failed to migrate:`, failedIds)
    }
  }

  public getResult(): MigrationResult {
    const { idsMap, failedMigrations } = this
    return {
      idsMap: new Map(idsMap.entries()),
      failedMigrations: Array.from(failedMigrations),
    }
  }
}
