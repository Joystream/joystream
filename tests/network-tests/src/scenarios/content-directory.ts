import leaderSetup from '../flows/workingGroup/leaderSetup'
import initializeContentDirectory from '../flows/contentDirectory/contentDirectoryInitialization'
import createChannel from '../flows/contentDirectory/creatingChannel'
import createVideo from '../flows/contentDirectory/creatingVideo'
import updateChannel from '../flows/contentDirectory/updatingChannel'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('setup content lead', leaderSetup.content)
    .then(job('init-content-dir', initializeContentDirectory))
    .then(job('create-channel', createChannel))
    .then(job('create-video', createVideo))
    .then(job('update-channel', updateChannel))
})
