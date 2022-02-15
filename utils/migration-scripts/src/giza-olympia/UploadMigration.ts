import { BaseMigration, BaseMigrationConfig, BaseMigrationParams } from './BaseMigration'
import { UploadManager } from './UploadManager'

export type UploadMigrationConfig = BaseMigrationConfig

export type UploadMigrationParams = BaseMigrationParams & {
  uploadManager: UploadManager
}

export abstract class UploadMigration extends BaseMigration {
  protected config: UploadMigrationConfig
  protected uploadManager: UploadManager

  public constructor({ api, queryNodeApi, config, uploadManager }: UploadMigrationParams) {
    super({ api, queryNodeApi, config })
    this.config = config
    this.uploadManager = uploadManager
  }
}
