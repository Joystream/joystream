import { createApp, createAppActions, updateApp } from '../flows/content/app'
import initFaucet from '../flows/faucet/initFaucet'
import leaderSetup from '../flows/working-groups/leadOpening'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('App', async ({ job }) => {
  job('Initialize Faucet', initFaucet)
  const leads = job('Set WorkingGroup Leads', leaderSetup(true))

  job('Create app', createApp).after(leads)
  job('Update app', updateApp).after(leads)
  job('Create app actions', createAppActions).after(leads)
})
