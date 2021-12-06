import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'

export default async function postMigrationAssertions({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:postMigrationAssertions')
    debug('Started')

    debug('Ensure migration is done')

    const channel_migration = await api.query.content.channelMigration();
    const video_migration = await api.query.content.videoMigration();

    assert(channel_migration.current_id.toNumber() == channel_migration.final_id.toNumber())
    assert(video_migration.current_id.toNumber() == video_migration.final_id.toNumber())

    debug('Check all working groups have been correctly created')
    const wg_alpha = await api.query.operationsWorkingGroupAlpha.activeWorkerCount();
    const wg_beta = await api.query.operationsWorkingGroupBeta.activeWorkerCount();
    const wg_gamma = await api.query.operationsWorkingGroupGamma.activeWorkerCount();
    const wg_gateway = await api.query.gatewayWorkingGroup.activeWorkerCount();
    const wg_content = await api.query.contentWorkingGroup.activeWorkerCount();

    assert(wg_alpha.toNumber() === 0);
    assert(wg_beta.toNumber() === 0);
    assert(wg_gamma.toNumber() === 0);
    assert(wg_gateway.toNumber() === 0);
    assert(wg_content.toNumber() === 0);

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
    const num_categories = await api.getNumberOfOutstandingVideoCategories()

    assert(num_channels === 0);
    assert(num_videos === 0);
    assert(num_categories === 0);

    debug('Done')
}
