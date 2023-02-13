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
  private failureExpected: boolean

  constructor(api: Api, query: QueryNodeApi, votes: Map<string, VotingParams>, failureExpected = false) {
    super(api, query)
    this.votes = votes
    this.failureExpected = failureExpected
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

  // Due to the fact that we need the transactions to be processed in the expected order
  // (which is not guaranteed by the nonce, because we're using different voter accounts),
  // we'll be including a small, decremental tip (10 JOY * (votersStakingAccounts.length - 1 - accIndex))
  public async execute(): Promise<void> {
    const accountOrAccounts = await this.getSignerAccountOrAccounts()
    const extrinsics = await this.getExtrinsics()
    this.extrinsics = extrinsics.flat()
    await this.api.prepareAccountsForFeeExpenses(accountOrAccounts, this.extrinsics, this.decrementalTip ? 10 : 0)
    this.results = await this.api.sendExtrinsicsAndGetResults(
      extrinsics,
      accountOrAccounts,
      this.decrementalTip ? 10 : 0
    )
    if (!this.failureExpected) {
      this.events = await Promise.all(this.results.map((r) => this.getEventFromResult(r)))
    }
  }

  public assertError(expectedErrName: string): void {
    const errNames = this.results.map((result) => {
      const name = this.api.getErrorNameFromExtrinsicFailedRecord(result)
      return name
    })
    const expectedNames = Array(this.results.length).fill(expectedErrName)
    assert.deepEqual(errNames, expectedNames)
  }
}
