import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'

export default async function postMigrationAssertions({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:postMigrationAssertions')
    debug('Started')

    debug('Ensure migration is done')

    const channel_migration = await api.query.content.channelMigration();
    const video_migration = await api.query.content.videoMigration();

    assert.equal(channel_migration.current_id.toNumber(), channel_migration.final_id.toNumber())
    assert.equal(video_migration.current_id.toNumber(), video_migration.final_id.toNumber())

    debug('Check all new  working groups have been correctly initialized')

    const wg_beta = await api.query.operationsWorkingGroupBeta.activeWorkerCount();
    const wg_gamma = await api.query.operationsWorkingGroupGamma.activeWorkerCount();
    const wg_gateway = await api.query.gatewayWorkingGroup.activeWorkerCount();

    assert.equal(wg_beta.toNumber(), 0);
    assert.equal(wg_gamma.toNumber(), 0);
    assert.equal(wg_gateway.toNumber(), 0);

    debug('Checking that Video, Channel, Categories  counters have not been re-set')

    const nextVideoCategoryId = await api.query.content.nextVideoCategoryId()
    const nextVideoId = await api.query.content.nextVideoId()
    const nextChannelId = await api.query.content.nextChannelId()

    assert(nextVideoCategoryId.toNumber() > 1);
    assert(nextVideoId.toNumber() > 1);
    assert(nextChannelId.toNumber() > 1);

    debug('Checking that number of outstanding channels & videos == 0');

    const num_channels = await api.getNumberOfOutstandingChannels()
    const num_videos = await api.getNumberOfOutstandingVideos()

    assert.equal(num_channels, 0);
    assert.equal(num_videos, 0);

    debug('Done')
}
