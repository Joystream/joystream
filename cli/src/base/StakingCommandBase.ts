import ExitCodes from '../ExitCodes'
import { AccountId } from '@joystream/types/common'
import { StakingLedger } from '@polkadot/types/interfaces'
import AccountsCommandBase from './AccountsCommandBase'
import { formatBalance } from '@polkadot/util'

export default abstract class StakingCommandBase extends AccountsCommandBase {
  private async availableControllers(): Promise<[AccountId, StakingLedger][]> {
    const controllers = await this.getStakingLedgers()
    return controllers
      .filter(([key, value]) => value.isSome && this.isKeyAvailable(key))
      .map(([key, value]) => [key, value.unwrap()])
  }

  private async getStakingLedgers() {
    const controllers = await this.getApi().allStakingLedgers()
    return controllers
  }

  async getController(): Promise<string> {
    const availableControllers = await this.availableControllers()
    const selectedValidator = await this.promptForController('No controller input', availableControllers)
    return availableControllers[selectedValidator][0].toString()
  }

  async promptForController(
    message = 'Choose your controller account',
    stakingAlternatives: [AccountId, StakingLedger][]
  ): Promise<number> {
    if (!stakingAlternatives.length) {
      this.warn('No controller accounts to choose from!')
      this.exit(ExitCodes.NoAccountFound)
    }
    const selectedController = await this.simplePrompt<number>({
      message,
      type: 'list',
      choices: stakingAlternatives.map((a) => ({
        name: `Controller: ${a[0].toString()}, with Stash ${a[1].stash.toString()} with an active stake: ${formatBalance(
          a[1].active
        )}`,
        value: stakingAlternatives.indexOf(a),
      })),
    })
    return selectedController
  }

  async isController(controllerInput: string) {
    if (this.isKeyAvailable(controllerInput)) {
      const info = (await this.getApi().getStakingLedger(controllerInput)).unwrapOr(undefined)
      if (info) {
        this.log(
          `Your controller ${controllerInput} with stash ${info.stash.toString()} is actively staking ${formatBalance(
            info.active
          )}`
        )
      } else {
        this.warn('Your account is not a controller!')
        this.exit(ExitCodes.InvalidInput)
      }
    } else {
      this.warn(`You don't have this account imported!`)
      this.exit(ExitCodes.NoAccountFound)
    }
  }

  async promptForCommission(
    message = 'Choose how much you reqiure as commission (between 0% and 100%)'
  ): Promise<number> {
    return await this.simplePrompt<number>({ message, type: 'number' })
  }

  async checkElectionStatus() {
    const electionStatus = await this.getApi().getEraElectionStatus()
    if (electionStatus.isOpen === true) {
      this.warn(
        'There is currently an ongoing election for new validator candidates. As such staking operations are not permitted. You need to wait'
      )
      this.exit(ExitCodes.ActionCurrentlyUnavailable)
    }
  }

  async getValidatorPrefs(commission: number | undefined): Promise<any> {
    let validatorPrefs = { 'commission': 0 }
    if (!commission) {
      commission = await this.promptForCommission()
    }
    if (commission >= 0 && commission <= 100) {
      validatorPrefs = { 'commission': commission * 10 ** 7 }
    } else {
      this.warn('Invalid commission input!')
      this.exit(ExitCodes.InvalidInput)
    }
    return validatorPrefs
  }
}
