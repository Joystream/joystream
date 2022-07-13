import { PalletStorageDistributionBucketIdRecord as DistributionBucketId } from '@polkadot/types/lookup'
import { createType } from '@joystream/types'

export class BucketIdParserService {
  static readonly bucketIdStrRegex = /^[0-9]+:[0-9]+$/

  public static parseBucketId(bucketIdStr: string): DistributionBucketId {
    if (!BucketIdParserService.bucketIdStrRegex.test(bucketIdStr)) {
      throw new Error(`Invalid bucket id! Expected format: {familyId}:{bucketIndex}`)
    }
    const [familyId, bucketIndex] = bucketIdStr.split(':')
    return createType('PalletStorageDistributionBucketIdRecord', {
      distributionBucketFamilyId: parseInt(familyId),
      distributionBucketIndex: parseInt(bucketIndex),
    })
  }

  public static formatBucketId(bucketId: DistributionBucketId): string {
    return `${bucketId.distributionBucketFamilyId.toString()}:${bucketId.distributionBucketIndex.toString()}`
  }
}
