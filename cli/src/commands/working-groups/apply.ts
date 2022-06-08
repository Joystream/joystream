import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { Option } from '@polkadot/types'
import { apiModuleByGroup } from '../../Api'
import { CreateInterface } from '@joystream/types'
import { ApplicationId, StakeParameters } from '@joystream/types/working-group'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'
import { metadataToBytes } from '../../helpers/serialization'
import { ApplicationMetadata } from '@joystream/metadata-protobuf'
import chalk from 'chalk'

export default class WorkingGroupsApply extends WorkingGroupsCommandBase {
  static description = 'Apply to a working group opening (requires a membership)'

  static flags = {
    openingId: flags.integer({
      description: 'Opening ID',
      required: true,
    }),
    roleAccount: flags.string({
      description: 'Future worker role account',
      required: false,
    }),
    rewardAccount: flags.string({
      description: 'Future worker reward account',
      required: false,
    }),
    stakingAccount: flags.string({
      description: "Account to hold applicant's / worker's stake",
      required: false,
    }),
    answers: flags.string({
      multiple: true,
      description: "Answers for opening's application form questions (sorted by question index)",
    }),
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    let { openingId, roleAccount, rewardAccount, stakingAccount, answers } = this.parse(WorkingGroupsApply).flags
    const memberContext = await this.getRequiredMemberContext()

    const opening = await this.getApi().groupOpening(this.group, openingId)

    if (!roleAccount) {
      roleAccount = await this.promptForAnyAddress('Choose role account')
    }

    if (!rewardAccount) {
      rewardAccount = await this.promptForAnyAddress('Choose reward account')
    }

    let stakeParams: CreateInterface<Option<StakeParameters>> = null
    const stakeLockId = this.getOriginalApi().consts[apiModuleByGroup[this.group]].stakingHandlerLockId
    if (opening.stake) {
      if (!stakingAccount) {
        stakingAccount = await this.promptForStakingAccount(
          opening.stake.value,
          memberContext.id,
          memberContext.membership,
          stakeLockId
        )
      } else {
        await this.setupStakingAccount(
          memberContext.id,
          memberContext.membership,
          stakingAccount,
          opening.stake.value,
          undefined,
          stakeLockId
        )
      }

      stakeParams = {
        stake: opening.stake.value,
        staking_account_id: stakingAccount,
      }
    }

    let applicationFormAnswers = (answers || []).map((answer, i) => ({ question: `Question ${i}`, answer }))
    if (opening.metadata) {
      const questions = opening.metadata.applicationFormQuestions
      if (!answers || !answers.length) {
        answers = []
        for (const i in questions) {
          const { question } = questions[i]
          const answer = await this.simplePrompt<string>({ message: `Application form question ${i}: ${question}` })
          answers.push(answer)
        }
      }
      if (answers.length !== questions.length) {
        this.error(`Unexpected number of answers! Expected: ${questions.length}, Got: ${answers.length}!`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      applicationFormAnswers = questions.map(({ question }, i) => ({
        question: question || '',
        answer: answers[i],
      }))
    } else {
      this.warn('Could not fetch opening metadata from query node! Application form answers cannot be validated.')
    }

    this.jsonPrettyPrint(
      JSON.stringify({ openingId, roleAccount, rewardAccount, stakingAccount, applicationFormAnswers })
    )
    await this.requireConfirmation('Do you confirm the provided input?')

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(memberContext.membership.controller_account.toString()),
      apiModuleByGroup[this.group],
      'applyOnOpening',
      [
        this.createType('ApplyOnOpeningParameters', {
          member_id: memberContext.id,
          opening_id: openingId,
          role_account_id: roleAccount,
          reward_account_id: rewardAccount,
          stake_parameters: stakeParams,
          description: metadataToBytes(ApplicationMetadata, { answers }),
        }),
      ]
    )
    const applicationId: ApplicationId = this.getEvent(result, apiModuleByGroup[this.group], 'AppliedOnOpening').data[1]
    this.log(chalk.greenBright(`Application with id ${chalk.magentaBright(applicationId)} succesfully created!`))
    this.output(applicationId.toString())
  }
}
