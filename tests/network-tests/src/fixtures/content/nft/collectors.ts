import { BaseQueryNodeFixture } from '../../../Fixture'
import { Api } from '../../../Api'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { assert } from 'chai'
import { ChannelNftCollectorFieldsFragment } from '../../../graphql/generated/queries'

export type IChannelCollectors = Record<string, Record<string, number>>

export class NftCollectorsFixture extends BaseQueryNodeFixture {
  private channelsCollectors: IChannelCollectors // -> Record<channelId, Record<memberId, amount>>

  constructor(api: Api, query: QueryNodeApi, channelsCollectors: IChannelCollectors) {
    super(api, query)
    this.channelsCollectors = channelsCollectors
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Check NFT collectors')

    await this.query.tryQueryWithTimeout(
      () => this.query.getChannelNftCollectors(),
      (channelNftCollectors: ChannelNftCollectorFieldsFragment[]) => {
        // construct dictionary of existing collectors
        const savedCollectorsByNftId = channelNftCollectors.reduce((acc, item) => {
          const channelId = item.channel.id
          // -1 represents absent owner member and won't interfere with anything
          const memberId = item.member?.id || '-1'

          acc[channelId] = acc[channelId] || {}
          acc[channelId][memberId] = item.amount

          return acc
        }, {} as IChannelCollectors)

        // check that current state equals to expected state
        for (const [channelId, memberIds] of Object.entries(this.channelsCollectors)) {
          for (const [memberId, amount] of Object.entries(memberIds)) {
            assert.equal(
              savedCollectorsByNftId[channelId][memberId],
              amount,
              'NFT collectors owns unexpected amount of NFTs'
            )
          }
        }
      }
    )
  }
}
