import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'

export default async function postMigrationAssertions({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:postMigrationAssertions')
    debug('Started')

    // check that counters haven't been re-set        
    debug('Checking that Video, Channel, Categories  counters have not been re-set')

    const nextVideoCategoryId = await api.query.content.nextVideoCategoryId()
    const nextVideoId = await api.query.content.nextVideoId()
    const nextChannelId = await api.query.content.nextChannelId()

    const num_channels = await api.getNumberOfOutstandingChannels()
    const num_videos = await api.getNumberOfOutstandingVideos()
    const num_categories = await api.getNumberOfOutstandingVideoCategories()

    assert(nextVideoCategoryId.toNumber() > 1);
    assert(nextVideoId.toNumber() > 1);
    assert(nextChannelId.toNumber() > 1);

    // asserting the number of outstanding channel & videos is 0
    debug('Checking that number of outstanding channels & videos == 0');

    assert(num_channels === 0);
    assert(num_videos === 0);
    assert(num_categories === 0);

    debug('Done')
}
