import { assert } from 'chai'
import Long from 'long'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MemberId } from '@joystream/types/primitives'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { BaseQueryNodeFixture } from '../../Fixture'
import BN from 'bn.js'

type AddStakingAccountInput = {
  asMember: MemberId
  account: string
  stakeAmount?: BN
}

export class VerifyValidatorAccountFixture extends BaseQueryNodeFixture {
  protected inputs: AddStakingAccountInput[]

  public constructor(api: Api, query: QueryNodeApi, inputs: AddStakingAccountInput[]) {
    super(api, query)
    this.inputs = inputs
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[][]> {
    const addExtrinsics = this.inputs.map(({ asMember }) => this.api.tx.members.addStakingAccountCandidate(asMember))
    const confirmExtrinsics = this.inputs.map(({ asMember, account }) =>
      this.api.tx.members.confirmStakingAccount(asMember, account)
    )
    return [addExtrinsics, confirmExtrinsics]
  }

  async execute(): Promise<void> {
    this.debug('Checking verify validator account')
  }
}
