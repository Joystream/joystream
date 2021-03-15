import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { Option } from '@polkadot/types'
import { apiModuleByGroup } from '../../Api'
import { CreateInterface } from '@joystream/types'
import { StakeParameters } from '@joystream/types/working-group'

export default class WorkingGroupsApply extends WorkingGroupsCommandBase {
  static description = 'Apply to a working group opening (requires a membership)'
  static args = [
    {
      name: 'openingId',
      description: 'Opening ID',
      required: false,
    },
  ]

  async run() {
    const { openingId } = this.parse(WorkingGroupsApply).args
    const [memberId, member] = await this.getRequiredMemberContext()

    const opening = await this.getApi().groupOpening(this.group, parseInt(openingId))

    const roleAccount = await this.promptForAnyAddress('Choose role account')
    const rewardAccount = await this.promptForAnyAddress('Choose reward account')

    let stakeParams: CreateInterface<Option<StakeParameters>> = null
    if (opening.stake) {
      const stakingAccount = await this.promptForStakingAccount(opening.stake.value, memberId, member)

      stakeParams = {
        stake: opening.stake.value,
        staking_account_id: stakingAccount,
      }
    }

    // TODO: Custom json?
    const description = await this.simplePrompt({
      message: 'Application description',
    })

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(member.controller_account.toString()),
      apiModuleByGroup[this.group],
      'applyOnOpening',
      [
        this.createType('ApplyOnOpeningParameters', {
          member_id: memberId,
          opening_id: openingId,
          role_account_id: roleAccount,
          reward_account_id: rewardAccount,
          stake_parameters: stakeParams,
          description,
        }),
      ]
    )
  }
}
