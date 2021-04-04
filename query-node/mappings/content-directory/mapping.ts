import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { SubstrateEvent } from '@dzlzv/hydra-common'

export {
  contentDirectory_EntitySchemaSupportAdded,
  contentDirectory_EntityRemoved,
  contentDirectory_EntityCreated,
  contentDirectory_EntityPropertyValuesUpdated,
} from './entity'
export { contentDirectory_TransactionCompleted, contentDirectory_TransactionFailed } from './transaction'

// Only one time to seed the database
// export { system_ExtrinsicSuccess } from './initializeDefaultSchemas'

// eslint-disable-next-line @typescript-eslint/naming-convention
export function system_ExtrinsicSuccess(db: DatabaseManager, event: SubstrateEvent): void {
  return
}
