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
  }

  protected getSignerAccountOrAccounts(): Promise<string | string[]> {
    return Promise.resolve(Array.from(this.votes.keys()))
  }

  protected getExtrinsics(): Promise<
    SubmittableExtrinsic<'promise', ISubmittableResult>[] | SubmittableExtrinsic<'promise', ISubmittableResult>[][]
  > {
    const results = Array.from(this.votes).map(async ([, params]) =>
      this.api.tx.referendum.vote(params.commitment, params.stake)
    )
    return Promise.all(results)
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails<unknown>> {
    return this.api.getEventDetails(result, 'referendum', 'VoteCast')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks
  }

  // overwriting for using decremental tips
  public async execute(): Promise<void> {
    const accountOrAccounts = await this.getSignerAccountOrAccounts()
    const extrinsics = await this.getExtrinsics()
    this.extrinsics = super.flattenExtrinsics(extrinsics)
    await this.api.prepareAccountsForFeeExpenses(accountOrAccounts, this.extrinsics, 10)
    this.results = await this.api.sendExtrinsicsAndGetResults(extrinsics, accountOrAccounts, 10)
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
