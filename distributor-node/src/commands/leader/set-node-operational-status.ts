import {
  INodeOperationalStatus,
  ISetNodeOperationalStatus,
  NodeOperationalStatus,
  SetNodeOperationalStatus,
} from '@joystream/metadata-protobuf'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeadSetNodeOperationalStatus extends AccountsCommandBase {
  static description = `Set/update distribution node operational status. Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    workerId: flags.integer({
      char: 'w',
      description: 'ID of the operator (distribution group worker)',
      required: true,
    }),
    operationalStatus: flags.enum<Exclude<NodeOperationalStatus['nodeOperationalStatus'], undefined>>({
      char: 'o',
      options: ['normal', 'noService', 'noServiceFrom', 'noServiceUntil'],
      required: true,
      description: 'Operational status of the operator',
    }),
    rationale: flags.string({
      char: 'r',
      description: 'Rationale for setting the operational status',
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const {
      bucketId,
      workerId,
      rationale,
      operationalStatus: statusType,
    } = this.parse(LeadSetNodeOperationalStatus).flags
    const leadKey = await this.getDistributorLeadKey()

    let operationalStatus: INodeOperationalStatus
    switch (statusType) {
      case 'normal': {
        operationalStatus = { normal: { rationale } }
        break
      }
      case 'noService': {
        operationalStatus = { noService: { rationale } }
        break
      }
      case 'noServiceFrom': {
        operationalStatus = {
          noServiceFrom: {
            rationale,
            from: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
          },
        }
        break
      }
      case 'noServiceUntil': {
        operationalStatus = {
          noServiceUntil: {
            rationale,
            from: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
            until: (await this.datePrompt({ message: 'Enter No Service period end date' })).toISOString(),
          },
        }
      }
    }

    this.log(`Setting node operational status...`, {
      bucketId: bucketId.toHuman(),
      workerId,
      operationalStatus,
    })

    const metadata: ISetNodeOperationalStatus = {
      workerId: workerId.toString(),
      bucketId: `${bucketId.distributionBucketFamilyId}:${bucketId.distributionBucketIndex}`,
      operationalStatus,
    }
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.distributionWorkingGroup.leadRemark(
        '0x' + Buffer.from(SetNodeOperationalStatus.encode(metadata).finish()).toString('hex')
      )
    )
    this.log('Bucket operator metadata successfully set/updated!')
  }
}
