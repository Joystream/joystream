import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, AnyQueryNodeEvent } from '../../types'

export type VotingParams = {
  commitment: string
  stake: BN
}

export class VoteFixture extends StandardizedFixture {
  private votes: Map<string, VotingParams>

  constructor(api: Api, query: QueryNodeApi, votes: Map<string, VotingParams>, failureExpected = false) {
    super(api, query)
    this.votes = votes
    this.decrementalTip = true
  }

  protected getSignerAccountOrAccounts(): Promise<string | string[]> {
    return Promise.resolve(Array.from(this.votes.keys()))
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> {
    return Array.from(this.votes).map(([, params]) => this.api.tx.referendum.vote(params.commitment, params.stake))
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails<unknown>> {
    return this.api.getEventDetails(result, 'referendum', 'VoteCast')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks
  }
}
