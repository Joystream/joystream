import { scenario } from '../Scenario'
import initDistributionBucket from '../flows/clis/initDistributionBucket'
import initStorageBucket from '../flows/clis/initStorageBucket'
import { storageSync } from '../flows/storage/storageSync'
import { storageCleanup } from '../flows/storage/storageCleanup'
import { setReplicationRate } from '../flows/storage/setReplicationRate'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Storage', async ({ job }) => {
  const setReplicationRateJob = job('set replication rate', setReplicationRate)
  const storageSyncJob = job('storage sync', storageSync).after(setReplicationRateJob)
  const storageCleanupJob = job('storage cleanup', storageCleanup).after(storageSyncJob)
  // Storage & distribution CLIs
  job('init storage and distribution buckets via CLI', [initDistributionBucket, initStorageBucket]).after(
    storageCleanupJob
  )
})
