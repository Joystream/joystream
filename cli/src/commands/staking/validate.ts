import StakingCommandBase from '../../base/StakingCommandBase'
import { flags } from '@oclif/command'

export default class StakingValidateCommand extends StakingCommandBase {
  static description = 'Start validating. Takes the controller key.'

  static flags = {
    commission: flags.integer({
      required: false,
      description:
        'Set a commission (0-100), which is deducted from all rewards before the remainder is split with nominator',
    }),
    controller: flags.string({
      required: false,
      description: 'The controller key you want to validate with.',
    }),
  }

  async run(): Promise<void> {
    let { commission, controller } = this.parse(StakingValidateCommand).flags
    const validatorPrefs = await this.getValidatorPrefs(commission)

    if (controller === undefined) {
      controller = await this.getController()
    } else {
      await this.isController(controller)
    }
    await this.checkElectionStatus()
    await this.sendAndFollowNamedTx(await this.getDecodedPair(controller), 'staking', 'validate', [validatorPrefs])
  }
}
