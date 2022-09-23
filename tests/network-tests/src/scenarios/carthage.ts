import constantAuthorities from '../flows/carthage/constantAuthorities'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Carthage', async ({ job }) => {
    job('authority set is constant', constantAuthorities)
})
