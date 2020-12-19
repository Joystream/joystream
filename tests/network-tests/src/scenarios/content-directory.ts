import leaderSetup from '../flows/workingGroup/leaderSetup'
import initializeContentDirectory from '../flows/contentDirectory/contentDirectoryInitialization'
import createChannel from '../flows/contentDirectory/creatingChannel'
import createVideo from '../flows/contentDirectory/creatingVideo'
import updateChannel from '../flows/contentDirectory/updatingChannel'
import { scenario } from '../Scenario'

scenario(async ({ api, env, query }) => {
  const leadKeyPair = await leaderSetup.content(api, env)

  await initializeContentDirectory(api, leadKeyPair)

  await createChannel(api, query)

  await createVideo(api, query)

  await updateChannel(api, query)
})
