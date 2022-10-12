import { BaseMigration, BaseMigrationConfig, BaseMigrationParams } from './BaseMigration'
import { AssetsManager, AssetsManagerConfig } from './AssetsManager'

export type AssetsMigrationConfig = BaseMigrationConfig & AssetsManagerConfig

export type AssetsMigrationParams = BaseMigrationParams & {
  assetsManager: AssetsManager
  config: AssetsMigrationConfig
}

export abstract class AssetsMigration extends BaseMigration {
  protected config: AssetsMigrationConfig
  protected assetsManager: AssetsManager

  public constructor({ api, queryNodeApi, config, assetsManager }: AssetsMigrationParams) {
    super({ api, queryNodeApi, config })
    this.config = config
    this.assetsManager = assetsManager
  }
}
