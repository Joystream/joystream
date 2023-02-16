import { createAppActions } from '../flows/content/createAppActions'
import leaderSetup from '../flows/working-groups/leadOpening'
import initFaucet from '../flows/faucet/initFaucet'
import { scenario } from '../Scenario'
import { createApp } from '../flows/content/createApp'
import { updateApp } from '../flows/content/updateApp'
import { deleteApp } from '../flows/content/deleteApp'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('App', async ({ job }) => {
  job('Initialize Faucet', initFaucet)

  const leads = job('Set WorkingGroup Leads', leaderSetup(true))
  job('Create app', createApp).after(leads)
  job('Update app', updateApp).after(leads)
  job('Create app actions', createAppActions).after(leads)
  job('Delete app', deleteApp).after(leads)
})
