import {
  INodeOperationalStatusMetadata,
  ISetNodeOperationalStatus,
  NodeOperationalStatusMetadata,
  SetNodeOperationalStatus,
} from '@joystream/metadata-protobuf'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import { NODE_OPERATIONAL_STATUS_OPTIONS, NodeOperationalStatus } from '../../types/metadata'

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
    operationalStatus: flags.enum<NodeOperationalStatus>({
      char: 'o',
      options: [...NODE_OPERATIONAL_STATUS_OPTIONS],
      required: false,
      description: 'Operational status of the operator',
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, workerId, operationalStatus: statusType } = this.parse(LeadSetNodeOperationalStatus).flags
    const leadKey = await this.getDistributorLeadKey()

    let operationalStatus: INodeOperationalStatusMetadata = {}
    switch (statusType) {
      case 'Normal': {
        operationalStatus = { status: NodeOperationalStatusMetadata.OperationalStatus.NORMAL }
        break
      }
      case 'NoService': {
        operationalStatus = { status: NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE }
        break
      }
      case 'NoServiceFrom': {
        operationalStatus = {
          status: NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE,
          noServiceFrom: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
        }
        break
      }
      case 'NoServiceDuring': {
        operationalStatus = {
          status: NodeOperationalStatusMetadata.OperationalStatus.NO_SERVICE,
          noServiceFrom: (await this.datePrompt({ message: 'Enter No Service period start date' })).toISOString(),
          noServiceTo: (await this.datePrompt({ message: 'Enter No Service period end date' })).toISOString(),
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
