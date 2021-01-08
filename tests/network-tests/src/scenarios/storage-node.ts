import getContentFromStorageNode from '../flows/storageNode/getContentFromStorageNode'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('content-from-storage-node', getContentFromStorageNode)
})
