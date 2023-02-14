import { scenario } from '../Scenario'
import { storageSync } from '../flows/storage/storageSync'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Storage sync', async ({ job }) => {
  // DEPENDS OF STORGE BEEING INITIALIZED WITH AT LEAST 2 BUCKETS!
  job('test storage node sync', storageSync)
})
