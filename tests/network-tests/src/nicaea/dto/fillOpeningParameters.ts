import BN from 'bn.js'

export class FillOpeningParameters {
  private amountPerPayout!: BN
  private nextPaymentAtBlock!: BN
  private payoutInterval!: BN
  private openingId!: BN
  private successfulApplicationId!: BN
  private workingGroup!: string

  public getAmountPerPayout(): BN {
    return this.amountPerPayout
  }

  public getNextPaymentAtBlock(): BN {
    return this.nextPaymentAtBlock
  }

  public getPayoutInterval(): BN {
    return this.payoutInterval
  }

  public getOpeningId(): BN {
    return this.openingId
  }

  public getSuccessfulApplicationId(): BN {
    return this.successfulApplicationId
  }

  public getWorkingGroup(): string {
    return this.workingGroup
  }

  public setAmountPerPayout(value: BN): FillOpeningParameters {
    this.amountPerPayout = value
    return this
  }

  public setNextPaymentAtBlock(value: BN): FillOpeningParameters {
    this.nextPaymentAtBlock = value
    return this
  }

  public setPayoutInterval(value: BN): FillOpeningParameters {
    this.payoutInterval = value
    return this
  }

  public setOpeningId(value: BN): FillOpeningParameters {
    this.openingId = value
    return this
  }

  public setSuccessfulApplicationId(value: BN): FillOpeningParameters {
    this.successfulApplicationId = value
    return this
  }

  public setWorkingGroup(value: string): FillOpeningParameters {
    this.workingGroup = value
    return this
  }

  constructor() {
    return
  }

  public getRewardPolicy() {
    return {
      amount_per_payout: this.amountPerPayout,
      next_payment_at_block: this.nextPaymentAtBlock,
      payout_interval: this.payoutInterval,
    }
  }

  public getFillOpeningParameters() {
    return {
      opening_id: this.openingId,
      successful_application_id: this.successfulApplicationId,
      reward_policy: this.getRewardPolicy(),
      working_group: this.workingGroup,
    }
  }
}
