import { INodeOperationalStatus, NodeOperationalStatus } from '@joystream/metadata-protobuf'
import { flags } from '@oclif/command'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
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
      description: 'ID of the operator (storage group worker)',
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
      description: 'Rationale for the operational status',
    }),
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const {
      bucketId,
      workerId,
      rationale,
      operationalStatus: statusType,
    } = this.parse(LeadSetNodeOperationalStatus).flags

    const account = this.getAccount()
    const api = await this.getApi()

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
      bucketId,
      workerId,
      operationalStatus,
    })

    const success = await setStorageNodeOperationalStatus(api, account, workerId, bucketId, operationalStatus)

    this.exitAfterRuntimeCall(success)
  }
}
