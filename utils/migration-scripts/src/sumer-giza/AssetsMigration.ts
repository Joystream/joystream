import { BaseMigration, BaseMigrationConfig, BaseMigrationParams, MigrationResult } from './BaseMigration'
import { AssetsManager, AssetsManagerConfig } from './AssetsManager'

export type AssetsMigrationConfig = BaseMigrationConfig & AssetsManagerConfig

export type AssetsMigrationParams = BaseMigrationParams & {
  config: AssetsMigrationConfig
}

export abstract class AssetsMigration extends BaseMigration {
  protected config: AssetsMigrationConfig
  protected assetsManager!: AssetsManager

  public constructor({ api, queryNodeApi, config }: AssetsMigrationParams) {
    super({ api, queryNodeApi, config })
    this.config = config
  }

  public async init(): Promise<void> {
    await super.init()
    this.assetsManager = await AssetsManager.create({
      api: this.api,
      queryNodeApi: this.queryNodeApi,
      config: this.config,
    })
  }

  public abstract run(): Promise<MigrationResult>

  protected saveMigrationState(): void {
    super.saveMigrationState()
    if (this.assetsManager.queueSize) {
      const failedUploadsFilePath = this.getMigrationStateFilePath().replace(
        '.json',
        `FailedUploads_${Date.now()}.json`
      )
      this.assetsManager.saveQueue(failedUploadsFilePath)
    }
  }
}
