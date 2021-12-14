import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import { Utils } from '../../utils'

export default async function postMigrationAssertions({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:postMigrationAssertions')
    debug('Started')

    debug('Ensure migration is done')

    let channel_migration = await api.query.content.channelMigration();
    let video_migration = await api.query.content.videoMigration();

    // wait for migration to be done and checking that index do actually change
    while (channel_migration.current_id.toNumber() < channel_migration.final_id.toNumber() ||
        video_migration.current_id.toNumber() < video_migration.final_id.toNumber()) {
        let channel_migration_new = await api.query.content.channelMigration();
        let video_migration_new = await api.query.content.videoMigration();

        // assert invariant in order to prevent infinite loop
        assert(channel_migration_new.current_id.toNumber() > channel_migration.current_id.toNumber());
        assert(video_migration_new.current_id.toNumber() > video_migration.current_id.toNumber());

        // update migration variables
        channel_migration = channel_migration_new;
        video_migration = video_migration_new;

        // wait 6 seconds
        await Utils.wait(6000)
    }

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
