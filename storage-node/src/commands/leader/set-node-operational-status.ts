import { INodeOperationalStatusMetadata, NodeOperationalStatusMetadata } from '@joystream/metadata-protobuf'
import { flags } from '@oclif/command'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import { NODE_OPERATIONAL_STATUS_OPTIONS, NodeOperationalStatus } from '../../services/metadata/schemas'
import { setStorageNodeOperationalStatus } from '../../services/runtime/extrinsics'

/**
 * CLI command:
 * et/update storage node operational status.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader privileges.
 * Shell command: "leader:set-node-operational-status"
 */
export default class LeadSetNodeOperationalStatus extends LeaderCommandBase {
  static description = `Set/update storage node operational status. Requires storage working group leader permissions.`

  static flags = {
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
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
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeadSetNodeOperationalStatus)

    const account = this.getAccount()
    const api = await this.getApi()

    let operationalStatus: INodeOperationalStatusMetadata = {}
    switch (flags.operationalStatus) {
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
      bucketId: flags.bucketId,
      workerId: flags.workerId,
      operationalStatus,
    })

    const success = await setStorageNodeOperationalStatus(
      api,
      account,
      flags.workerId,
      flags.bucketId,
      operationalStatus
    )

    this.exitAfterRuntimeCall(success)

    this.log('Successfully set storage node operational status!')
  }
}
