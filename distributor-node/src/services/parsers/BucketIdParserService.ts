import { DistributionBucketId } from '@joystream/types/storage'
import { createType } from '@joystream/types'

export class BucketIdParserService {
  static readonly bucketIdStrRegex = /^[0-9]+:[0-9]+$/

  public static parseBucketId(bucketIdStr: string): DistributionBucketId {
    if (!BucketIdParserService.bucketIdStrRegex.test(bucketIdStr)) {
      throw new Error(`Invalid bucket id! Expected format: {familyId}:{bucketIndex}`)
    }
    const [familyId, bucketIndex] = bucketIdStr.split(':')
    return createType<DistributionBucketId, 'DistributionBucketId'>('DistributionBucketId', {
      distribution_bucket_family_id: parseInt(familyId),
      distribution_bucket_index: parseInt(bucketIndex),
    })
  }

  public static formatBucketId(bucketId: DistributionBucketId): string {
    return `${bucketId.distribution_bucket_family_id.toString()}:${bucketId.distribution_bucket_index.toString()}`
  }
}
