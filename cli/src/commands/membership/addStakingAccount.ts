import BN from 'bn.js'
import { flags } from '@oclif/command'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

export default class MembershipAddStakingAccountCommand extends MembershipsCommandBase {
  static description = 'Associate a new staking account with an existing membership.'
  static flags = {
    address: flags.string({
      required: false,
      description: 'Address of the staking account to be associated with the member',
    }),
    withBalance: flags.integer({
      required: false,
      description: 'Allows optionally specifying required initial balance for the staking account',
    }),
    fundsSource: flags.string({
      required: false,
      description:
        'If provided, this account will be used as funds source for the purpose of initializing the staking accout',
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { address, withBalance, fundsSource } = this.parse(MembershipAddStakingAccountCommand).flags
    const { id, membership } = await this.getRequiredMemberContext()
    await this.setupStakingAccount(id, membership, address, new BN(withBalance || 0), fundsSource)
  }
}
