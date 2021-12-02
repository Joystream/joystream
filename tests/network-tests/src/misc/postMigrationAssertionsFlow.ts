import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { FixtureRunner } from '../Fixture'
import { extendDebug } from '../Debugger'

export default async function mockContent({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:postMigrationAssertions')
    debug('Started')

    // check that counters haven't been re-set        
    debug('Checking that Video, Channel, Categories  counters have not been re-set')

    const nextVideoCategoryId = await api.query.content.nextVideoCategoryId()
    const nextChannelCategoryId = await api.query.content.nextVideoCategoryId()
    const nextVideoId = await api.query.content.nextVideoId()
    const nextChannelId = await api.query.content.nextChannelId()


    assert(nextVideoCategoryId.toNumber() > 1);
    assert(nextChannelCategoryId.toNumber() > 1);
    assert(nextVideoId.toNumber() > 1);
    assert(nextChannelId.toNumber() > 1);


    debug('Done')
}
