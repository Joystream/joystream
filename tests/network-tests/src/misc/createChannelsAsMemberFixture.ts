import { BaseQueryNodeFixture } from '../Fixture'
import { Api } from '../Api'
import { ChannelId, DistributionBucketFamilyId } from '@joystream/types/primitives'
import { QueryNodeApi } from '../QueryNodeApi'

export class CreateChannelsAsMemberFixture extends BaseQueryNodeFixture {
  // Member that will be channel owner
  private memberId: number
  private numChannels: number
  private createdChannels: ChannelId[] = []

  constructor(api: Api, query: QueryNodeApi, memberId: number, numChannels: number) {
    super(api, query)
    this.memberId = memberId
    this.numChannels = numChannels
  }

  public getCreatedChannels(): ChannelId[] {
    return this.createdChannels.slice()
  }

  async selectStorageBucketsForNewChannel(): Promise<number[]> {
    const storageBuckets = await this.query.storageBucketsForNewChannel()
    const { numberOfStorageBuckets: storageBucketsPolicy } = await this.api.query.storage.dynamicBagCreationPolicies(
      'Channel'
    )

    if (!storageBuckets || storageBuckets.length < storageBucketsPolicy.toNumber()) {
      throw new Error(`Storage buckets policy constraint unsatifified. Not enough storage buckets exist`)
    }

    return storageBuckets.map((b) => Number(b.id)).slice(0, storageBucketsPolicy.toNumber())
  }

  async selectDistributionBucketsForNewChannel(): Promise<
    { distributionBucketFamilyId: number; distributionBucketIndex: number }[]
  > {
    const { families: distributionBucketFamiliesPolicy } = await this.api.query.storage.dynamicBagCreationPolicies(
      'Channel'
    )

    const families = await this.query.distributionBucketsForNewChannel()
    const distributionBucketIds = []

    for (const { id, buckets } of families || []) {
      const bucketsCountPolicy = distributionBucketFamiliesPolicy.get(id as unknown as DistributionBucketFamilyId)
      if (bucketsCountPolicy && bucketsCountPolicy.toNumber() < buckets.length) {
        throw new Error(`Distribution buckets policy constraint unsatifified. Not enough distribution buckets exist`)
      }

      distributionBucketIds.push(
        ...buckets
          .map(({ bucketIndex }) => {
            return {
              distributionBucketFamilyId: Number(id),
              distributionBucketIndex: bucketIndex,
            }
          })
          .slice(0, bucketsCountPolicy?.toNumber())
      )
    }
    return distributionBucketIds
  }

  public async execute(): Promise<void> {
    const account = await this.api.getMemberControllerAccount(this.memberId)

    const channels: Promise<ChannelId>[] = []
    for (let i = 0; i < this.numChannels; i++) {
      const storageBuckets = await this.selectStorageBucketsForNewChannel()
      const distributionBuckets = await this.selectDistributionBucketsForNewChannel()
      channels.push(this.api.createMockChannel(this.memberId, storageBuckets, distributionBuckets, account))
    }

    this.createdChannels = await Promise.all(channels)
  }
}
