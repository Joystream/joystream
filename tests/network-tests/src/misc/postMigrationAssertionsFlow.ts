import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import { Utils } from '../utils'

export default async function postMigrationAssertions({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:postMigrationAssertions')
    debug('Started')

    debug('Ensure migration is done')

    let channelMigration = await api.query.content.channelMigration()
    let videoMigration = await api.query.content.videoMigration()

    // wait for migration to be done and checking that index do actually change
    while (
        channelMigration.current_id.toNumber() < channelMigration.final_id.toNumber() ||
        videoMigration.current_id.toNumber() < videoMigration.final_id.toNumber()
    ) {
        // wait 6 seconds until next block is produced
        await Utils.wait(6000)

        const channelMigrationNew = await api.query.content.channelMigration()
        const videoMigrationNew = await api.query.content.videoMigration()

        // check invariant in order to prevent infinite loop
        if (
            channelMigrationNew.current_id.toNumber() > channelMigration.current_id.toNumber() ||
            videoMigrationNew.current_id.toNumber() > videoMigration.current_id.toNumber()
        ) {
            // update migration variables
            channelMigration = channelMigrationNew
            videoMigration = videoMigrationNew

        } else {
            throw new Error('Migration status not changing')
        }
    }

    debug('Check all new  working groups have been correctly initialized')

    const wgBeta = await api.query.operationsWorkingGroupBeta.activeWorkerCount()
    const wgGamma = await api.query.operationsWorkingGroupGamma.activeWorkerCount()
    const wgGateway = await api.query.gatewayWorkingGroup.activeWorkerCount()

    assert.equal(wgBeta.toNumber(), 0)
    assert.equal(wgGamma.toNumber(), 0)
    assert.equal(wgGateway.toNumber(), 0)

    debug('Checking that Video, Channel, Categories  counters have not been re-set')

    const nextVideoCategoryId = await api.query.content.nextVideoCategoryId()
    const nextVideoId = await api.query.content.nextVideoId()
    const nextChannelId = await api.query.content.nextChannelId()

    assert(nextVideoCategoryId.toNumber() > 1)
    assert(nextVideoId.toNumber() > 1)
    assert(nextChannelId.toNumber() > 1)

    debug('Checking that number of outstanding channels & videos == 0')

    const numChannels = await api.getNumberOfOutstandingChannels()
    const numVideos = await api.getNumberOfOutstandingVideos()

    assert.equal(numChannels, 0)
    assert.equal(numVideos, 0)

    debug('Done')
}
