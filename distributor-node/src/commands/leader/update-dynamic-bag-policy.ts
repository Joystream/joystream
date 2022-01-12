import { flags } from '@oclif/command'
import { DynamicBagTypeKey } from '@joystream/types/storage'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'
import { createType } from '@joystream/types'

export default class LeaderUpdateDynamicBagPolicy extends AccountsCommandBase {
  static description = `Update dynamic bag creation policy (number of buckets by family that should store given dynamic bag type).
    Requires distribution working group leader permissions.`

  static flags = {
    type: flags.enum<DynamicBagTypeKey>({
      char: 't',
      description: 'Dynamic bag type',
      options: ['Member', 'Channel'],
      required: true,
    }),
    policy: flags.build({
      parse: (v) => {
        const pair = v.split(':')
        if (pair.length !== 2 || !/^\d+$/.test(pair[0]) || !/^\d+$/.test(pair[1])) {
          throw new Error(`Expected {familyId}:{numberOfBuckets} pair, got: ${v}`)
        }
        return [parseInt(pair[0]), parseInt(pair[1])] as [number, number]
      },
    })({
      char: 'p',
      description: 'Key-value pair of {familyId}:{numberOfBuckets}',
      multiple: true,
      default: [],
    }),
    ...DefaultCommandBase.flags,
  }

  static examples = [`$ joystream-distributor leader:update-dynamic-bag-policy -t Member -p 1:5 2:10 3:5`]

  async run(): Promise<void> {
    const { type, policy } = this.parse(LeaderUpdateDynamicBagPolicy).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Updating dynamic bag policy...`, {
      type,
      policy: policy.map(([familyId, numberOfBuckets]) => ({ familyId, numberOfBuckets })),
    })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateFamiliesInDynamicBagCreationPolicy(
        type,
        createType('DynamicBagCreationPolicyDistributorFamiliesMap', new Map(policy))
      )
    )
    this.log('Dynamic bag creation policy succesfully updated!')
  }
}
