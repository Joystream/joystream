import { scenario } from '../Scenario'
import { extendDebug } from '../Debugger'
import BN from 'bn.js'
import { Utils } from '../utils'

scenario('Post Runtime Upgrade', async ({ job }) => {
    job('dummy', async () => {
        const debug = extendDebug('flow:postMigrationNftValuesAssertion')
        debug('Started')

        debug('Check that post migration NFT value are set')

        let maxNftStartingPrice = await api.getMaxNftStartingPrice()
        let maxNftBidStep = await api.getMaxNftBidStep()

        assert.equal(maxNftStartingPrice, BN(1000000000000))
        assert.equal(maxNftBidStep, BN(1000000000000))

        debug('Done')
    }
})
