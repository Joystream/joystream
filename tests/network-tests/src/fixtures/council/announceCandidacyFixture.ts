import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import BN from 'bn.js'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, AnyQueryNodeEvent } from '../../types'
import { BaseFixture, StandardizedFixture } from '../../Fixture'

export type AnnouncementParams = {
  memberId: BN
  stakingAccount: string
  rewardAccount: string
  stake: BN
}

export class AnnounceCandidacyFixture extends StandardizedFixture {
  private announcements: Map<string, AnnouncementParams>

  constructor(api: Api, query: QueryNodeApi, announcements: Map<string, AnnouncementParams>) {
    super(api, query)
    this.announcements = announcements
  }

  protected getSignerAccountOrAccounts(): Promise<string | string[]> {
    return Promise.resolve(Array.from(this.announcements.keys()))
  }

  protected getExtrinsics(): Promise<
    SubmittableExtrinsic<'promise', ISubmittableResult>[] | SubmittableExtrinsic<'promise', ISubmittableResult>[][]
  > {
    const results = Array.from(this.announcements).map(async ([, params]) =>
      this.api.tx.council.announceCandidacy(params.memberId, params.stakingAccount, params.rewardAccount, params.stake)
    )
    return Promise.all(results)
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails<unknown>> {
    return this.api.getEventDetails(result, 'council', 'NewCandidate')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks
  }
}
