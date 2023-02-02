import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, AnyQueryNodeEvent } from '../../types'

export class BlackListVoteFixture extends StandardizedFixture {
  private accountsToBlacklist: string[]
  constructor(api: Api, query: QueryNodeApi, accountsToBlacklist: string[]) {
    super(api, query)
    this.accountsToBlacklist = accountsToBlacklist
  }
  protected getSignerAccountOrAccounts(): Promise<string | string[]> {
    return Promise.resolve(this.accountsToBlacklist)
  }
  protected getExtrinsics(): Promise<
    SubmittableExtrinsic<'promise', ISubmittableResult>[] | SubmittableExtrinsic<'promise', ISubmittableResult>[][]
  > {
    return Promise.all(this.accountsToBlacklist.map(async () => await this.api.tx.referendum.optOutOfVoting()))
  }
  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails<unknown>> {
    return this.api.getEventDetails(result, 'referendum', 'AccountOptedOutOfVoting')
  }
  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement as soon as QN support is added
  }
}
