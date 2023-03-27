import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { GroupMember, WorkingGroupDiscretionarySpendingInputParameters } from '../../Types'
import { WorkingGroupsDiscretionarySpendingSchema } from '../../schemas/WorkingGroups'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { isValidBalance, validateAddress } from '../../helpers/validation'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import {
  IOpeningMetadata,
  IWorkingGroupMetadataAction,
  OpeningMetadata,
  WorkingGroupMetadataAction,
} from '@joystream/metadata-protobuf'

export default class WorkingGroupsDiscretionarySpendingMulti extends WorkingGroupsCommandBase {
  static description = "Change given worker's reward (amount only). Requires lead access."
  static flags = {
    input: IOFlags.input,
    ...WorkingGroupsCommandBase.flags,
  }

  // prepareMetadata(openingParamsJson: WorkingGroupDiscretionarySpendingInputParameters): IOpeningMetadata {
  //   return {
  //     ...openingParamsJson,
  //     applicationFormQuestions: openingParamsJson.applicationFormQuestions?.map((q) => ({
  //       question: q.question,
  //       type: OpeningMetadata.ApplicationFormQuestion.InputType[q.type],
  //     })),
  //   }
  // }

  async getInputFromFile(filePath: string): Promise<WorkingGroupDiscretionarySpendingInputParameters> {
    return getInputJson<WorkingGroupDiscretionarySpendingInputParameters>(
      filePath,
      WorkingGroupsDiscretionarySpendingSchema
    )
  }

  async run(): Promise<void> {
    const lead = await this.getRequiredLeadContext()

    const {
      flags: { input },
    } = this.parse(WorkingGroupsDiscretionarySpendingMulti)

    const openingJson = input ? await this.getInputFromFile(input) : undefined

    if (openingJson === undefined) {
      this.log(chalk.red(`error:The file is empty!`))
      return
    }

    for (let i = 0; i < openingJson.length; i++) {
      const element = openingJson[i]

      if (!isValidBalance(element.amount)) {
        this.error(chalk.red('Invalid amount'), { exit: ExitCodes.InvalidInput })
      }
      if (!element.address) {
        this.error(chalk.red('Invalid address'), { exit: ExitCodes.InvalidInput })
      }
      if (!element.rationale) {
        this.error(chalk.red('Invalid rationale'), { exit: ExitCodes.InvalidInput })
      }
      await this.sendAndFollowNamedTxMuilt(
        await this.getDecodedPair(lead.roleAccount),
        apiModuleByGroup[this.group],
        'spendFromBudget',
        [element.address, element.amount, element.rationale]
      )
    }

    this.log(chalk.green(`Transaction Finished !!!`))
  }
}
