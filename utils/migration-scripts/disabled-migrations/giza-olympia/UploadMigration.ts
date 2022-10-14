import { BaseMigration, BaseMigrationConfig, BaseMigrationParams } from './BaseMigration'
import { UploadManager } from './UploadManager'
import { ContentDirectorySnapshot } from './SnapshotManager'

export type UploadMigrationConfig = BaseMigrationConfig

export type UploadMigrationParams = BaseMigrationParams<ContentDirectorySnapshot> & {
  uploadManager: UploadManager
}

export abstract class UploadMigration extends BaseMigration<ContentDirectorySnapshot> {
  protected config: UploadMigrationConfig
  protected uploadManager: UploadManager

  public constructor({ api, snapshot, config, uploadManager }: UploadMigrationParams) {
    super({ api, snapshot, config })
    this.config = config
    this.uploadManager = uploadManager
  }
}
