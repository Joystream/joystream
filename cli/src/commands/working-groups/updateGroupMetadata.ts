import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroupUpdateStatusInputParameters } from '../../Types'
import { WorkingGroupUpdateStatusInputSchema } from '../../schemas/WorkingGroups'
import chalk from 'chalk'
import { apiModuleByGroup } from '../../Api'
import { getInputJson } from '../../helpers/InputOutput'
import { flags } from '@oclif/command'
import { IWorkingGroupMetadataAction, WorkingGroupMetadataAction } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'

export default class WorkingGroupsUpdateMetadata extends WorkingGroupsCommandBase {
  static description =
    'Update working group metadata (description, status etc.). The update will be atomic (just like video / channel metadata updates)'

  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    // lead-only gate
    const lead = await this.getRequiredLeadContext()

    const {
      flags: { input: inputFilePath },
    } = this.parse(WorkingGroupsUpdateMetadata)

    const input = await getInputJson<WorkingGroupUpdateStatusInputParameters>(
      inputFilePath,
      WorkingGroupUpdateStatusInputSchema
    )
    const actionMetadata: IWorkingGroupMetadataAction = {
      'setGroupMetadata': {
        newMetadata: input,
      },
    }

    this.jsonPrettyPrint(JSON.stringify(actionMetadata))

    await this.requireConfirmation('Do you confirm the provided input?')

    await this.sendAndFollowTx(
      await this.getDecodedPair(lead.roleAccount),
      this.getOriginalApi().tx[apiModuleByGroup[this.group]].setStatusText(
        metadataToBytes(WorkingGroupMetadataAction, actionMetadata)
      )
    )
    this.log(chalk.green(`Working group metadata successfully updated!`))
  }
}
