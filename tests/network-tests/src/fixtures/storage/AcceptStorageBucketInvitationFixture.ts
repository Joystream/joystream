import { StorageBucketId, WorkerId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import BN from 'bn.js'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { AnyQueryNodeEvent, EventDetails, EventType } from '../../types'

const TRANSACTOR_ACCOUNT_BALANCE = new BN(9_000_000_000_000_000)

type StorageBucketInvitationAcceptedEventDetails = EventDetails<EventType<'storage', 'StorageBucketInvitationAccepted'>>

export type AcceptStorageBucketInvitationParams = {
  workerId: WorkerId
  bucketId: StorageBucketId
  transactorAccountId: string
}

export class AcceptStorageBucketInvitationFixture extends StandardizedFixture {
  private acceptStorageBucketInvitationParams: AcceptStorageBucketInvitationParams[]

  constructor(
    api: Api,
    query: QueryNodeApi,
    acceptStorageBucketInvitationParams: AcceptStorageBucketInvitationParams[]
  ) {
    super(api, query)
    this.acceptStorageBucketInvitationParams = acceptStorageBucketInvitationParams
  }

  protected async getSignerAccountOrAccounts(): Promise<string | string[]> {
    return await Promise.all(
      this.acceptStorageBucketInvitationParams.map(async ({ workerId }) =>
        (await this.api.query.storageWorkingGroup.workerById(workerId)).unwrap().roleAccountId.toString()
      )
    )
  }

  public async execute(): Promise<void> {
    // Send some funds to transactor accounts
    await Promise.all(
      this.acceptStorageBucketInvitationParams.map(({ transactorAccountId }) =>
        this.api.treasuryTransferBalance(transactorAccountId, TRANSACTOR_ACCOUNT_BALANCE)
      )
    )
    await super.execute()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> {
    return this.acceptStorageBucketInvitationParams.map(({ workerId, bucketId, transactorAccountId }) => {
      return this.api.tx.storage.acceptStorageBucketInvitation(workerId, bucketId, transactorAccountId)
    })
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<StorageBucketInvitationAcceptedEventDetails> {
    return this.api.getEventDetails(result, 'storage', 'StorageBucketInvitationAccepted')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks after mappings are added
  }
}
