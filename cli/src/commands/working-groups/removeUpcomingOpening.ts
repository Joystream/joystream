import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import chalk from 'chalk'
import { apiModuleByGroup } from '../../Api'
import { flags } from '@oclif/command'
import { IWorkingGroupMetadataAction, WorkingGroupMetadataAction } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import ExitCodes from '../../ExitCodes'

export default class WorkingGroupsRemoveUpcomingOpening extends WorkingGroupsCommandBase {
  static description =
    'Remove an existing upcoming opening by sending RemoveUpcomingOpening metadata signal (requires lead access)'

  static flags = {
    id: flags.string({
      char: 'i',
      required: true,
      description: `Id of the upcoming opening to remove`,
    }),
    ...WorkingGroupsCommandBase.flags,
  }

  async checkIfUpcomingOpeningExists(id: string): Promise<void> {
    if (this.isQueryNodeUriSet()) {
      const upcomingOpening = await this.getQNApi().upcomingWorkingGroupOpeningById(id)
      this.log(`Upcoming opening by id ${id} found:`)
      this.jsonPrettyPrint(JSON.stringify(upcomingOpening))
      this.log('\n')
    } else {
      this.warn('Query node uri not set, cannot verify if upcoming opening exists!')
    }
  }

  async checkIfUpcomingOpeningRemoved(id: string): Promise<void> {
    if (this.isQueryNodeUriSet()) {
      let removed = false
      let currentAttempt = 0
      const maxRetryAttempts = 5
      while (!removed && currentAttempt <= maxRetryAttempts) {
        ++currentAttempt
        removed = !(await this.getQNApi().upcomingWorkingGroupOpeningById(id))
        if (!removed && currentAttempt <= maxRetryAttempts) {
          this.log(
            `Waiting for the upcoming opening removal to be processed by the query node (${currentAttempt}/${maxRetryAttempts})...`
          )
          await new Promise((resolve) => setTimeout(resolve, 6000))
        }
      }
      if (!removed) {
        this.error('Could not confirm upcoming opening removal against the query node', {
          exit: ExitCodes.QueryNodeError,
        })
      }
      this.log(chalk.green(`Upcoming opening with id ${chalk.magentaBright(id)} successfully removed!`))
    } else {
      this.warn('Query node uri not set, cannot verify if upcoming opening was removed!')
    }
  }

  async run(): Promise<void> {
    const { id } = this.parse(WorkingGroupsRemoveUpcomingOpening).flags
    // lead-only gate
    const lead = await this.getRequiredLeadContext()

    await this.checkIfUpcomingOpeningExists(id)

    const actionMetadata: IWorkingGroupMetadataAction = {
      'removeUpcomingOpening': {
        id,
      },
    }

    this.jsonPrettyPrint(JSON.stringify({ WorkingGroupMetadataAction: actionMetadata }))

    await this.requireConfirmation('Do you confirm the provided input?')

    await this.sendAndFollowTx(
      await this.getDecodedPair(lead.roleAccount),
      this.getOriginalApi().tx[apiModuleByGroup[this.group]].setStatusText(
        metadataToBytes(WorkingGroupMetadataAction, actionMetadata)
      )
    )

    await this.checkIfUpcomingOpeningRemoved(id)
  }
}
