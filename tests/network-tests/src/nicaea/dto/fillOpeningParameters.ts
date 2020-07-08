import BN from 'bn.js';

export class FillOpeningParameters {
  private amountPerPayout!: BN;
  private nextPaymentAtBlock!: BN;
  private payoutInterval!: BN;
  private openingId!: BN;
  private successfulApplicationId!: BN;
  private workingGroup!: string;

  public getAmountPerPayout(): BN {
    return this.amountPerPayout;
  }

  public getNextPaymentAtBlock(): BN {
    return this.nextPaymentAtBlock;
  }

  public getPayoutInterval(): BN {
    return this.payoutInterval;
  }

  public getOpeningId(): BN {
    return this.openingId;
  }

  public getSuccessfulApplicationId(): BN {
    return this.successfulApplicationId;
  }

  public getWorkingGroup(): string {
    return this.workingGroup;
  }

  public setAmountPerPayout(value: BN) {
    this.amountPerPayout = value;
  }

  public setNextPaymentAtBlock(value: BN) {
    this.nextPaymentAtBlock = value;
  }

  public setPayoutInterval(value: BN) {
    this.payoutInterval = value;
  }

  public setOpeningId(value: BN) {
    this.openingId = value;
  }

  public setSuccessfulApplicationId(value: BN) {
    this.successfulApplicationId = value;
  }

  public setWorkingGroup(value: string) {
    this.workingGroup = value;
  }

  constructor() {}

  public getRewardPolicy() {
    return {
      amount_per_payout: this.amountPerPayout,
      next_payment_at_block: this.nextPaymentAtBlock,
      payout_interval: this.payoutInterval,
    };
  }

  public getFillOpeningParameters() {
    return {
      opening_id: this.openingId,
      successful_application_id: this.successfulApplicationId,
      reward_policy: this.getRewardPolicy(),
      working_group: this.workingGroup,
    };
  }
}
