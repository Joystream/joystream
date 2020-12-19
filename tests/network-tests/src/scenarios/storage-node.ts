import getContentFromStorageNode from '../flows/storageNode/getContentFromStorageNode'
import { scenario } from '../Scenario'

scenario(async ({ api, query }) => {
  await getContentFromStorageNode(api, query)
})
