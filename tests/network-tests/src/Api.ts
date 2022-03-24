import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { u32, BTreeSet } from '@polkadot/types'
import { ISubmittableResult, Codec } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { AccountId, ChannelId, MemberId } from '@joystream/types/common'

import { AccountInfo, Balance, EventRecord, BlockNumber, BlockHash, LockIdentifier } from '@polkadot/types/interfaces'
import { Worker, WorkerId, Opening, OpeningId } from '@joystream/types/working-group'
import { DataObjectId, StorageBucketId } from '@joystream/types/storage'

import BN from 'bn.js'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Sender, LogLevel } from './sender'
import { Utils } from './utils'
import { types } from '@joystream/types'

import { extendDebug } from './Debugger'
import { DispatchError } from '@polkadot/types/interfaces/system'
import {
  EventDetails,
  EventSection,
  EventMethod,
  EventType,
  KeyGenInfo,
  WorkingGroupModuleName,
  ProposalType,
  FaucetInfo,
} from './types'

import { ProposalParameters } from '@joystream/types/proposals'
import {
  BLOCKTIME,
  KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE,
  proposalTypeToProposalParamsKey,
  workingGroupNameByModuleName,
} from './consts'

import { VideoId, VideoCategoryId, AuctionParams } from '@joystream/types/content'

import { ChannelCategoryMetadata, VideoCategoryMetadata } from '@joystream/metadata-protobuf'

export class ApiFactory {
  private readonly api: ApiPromise
  private readonly keyring: Keyring
  // number used as part of key derivation path
  private keyId = 0
  // stores names of the created custom keys
  private customKeys: string[] = []
  // mapping from account address to key id.
  // To be able to re-derive keypair externally when mini-secret is known.
  readonly addressesToKeyId: Map<string, number> = new Map()
  // mapping from account address to suri.
  // To be able to get the suri of a known key for the purpose of, for example, interacting with the CLIs
  readonly addressesToSuri: Map<string, string>
  // mini secret used in SURI key derivation path
  private readonly miniSecret: string

  // source of funds for all new accounts
  private readonly treasuryAccount: string

  // faucet details
  public faucetInfo: FaucetInfo

  public static async create(
    provider: WsProvider,
    treasuryAccountUri: string,
    sudoAccountUri: string,
    miniSecret: string
  ): Promise<ApiFactory> {
    const debug = extendDebug('api-factory')
    let connectAttempts = 0
    while (true) {
      connectAttempts++
      debug(`Connecting to chain, attempt ${connectAttempts}..`)
      try {
        const api = new ApiPromise({ provider, types })

        // Wait for api to be connected and ready
        await api.isReadyOrError

        // If a node was just started up it might take a few seconds to start producing blocks
        // Give it a few seconds to be ready.
        await Utils.wait(5000)

        return new ApiFactory(api, treasuryAccountUri, sudoAccountUri, miniSecret)
      } catch (err) {
        if (connectAttempts === 3) {
          throw new Error('Unable to connect to chain')
        }
      }
      await Utils.wait(5000)
    }
  }

  constructor(api: ApiPromise, treasuryAccountUri: string, sudoAccountUri: string, miniSecret: string) {
    this.api = api
    this.keyring = new Keyring({ type: 'sr25519' })
    this.treasuryAccount = this.keyring.addFromUri(treasuryAccountUri).address
    this.keyring.addFromUri(sudoAccountUri)
    this.miniSecret = miniSecret
    this.addressesToKeyId = new Map()
    this.addressesToSuri = new Map()
    this.keyId = 0
    this.faucetInfo = { suri: '', memberId: 0 }
  }

  public getApi(label: string): Api {
    return new Api(this, this.api, this.treasuryAccount, this.keyring, label)
  }

  public setFaucetInfo(info: FaucetInfo): void {
    this.faucetInfo = info
  }

  public createKeyPairs(n: number): { key: KeyringPair; id: number }[] {
    const keys: { key: KeyringPair; id: number }[] = []
    for (let i = 0; i < n; i++) {
      const id = this.keyId++
      const key = this.createKeyPair(`${id}`)
      keys.push({ key, id })
      this.addressesToKeyId.set(key.address, id)
    }
    return keys
  }

  private createKeyPair(suriPath: string, isCustom = false, isFinalPath = false): KeyringPair {
    if (isCustom) {
      this.customKeys.push(suriPath)
    }
    const uri = isFinalPath ? suriPath : `${this.miniSecret}//testing//${suriPath}`
    const pair = this.keyring.addFromUri(uri)
    this.addressesToSuri.set(pair.address, uri)
    return pair
  }

  public createCustomKeyPair(customPath: string, isFinalPath: boolean): KeyringPair {
    return this.createKeyPair(customPath, true, isFinalPath)
  }

  public keyGenInfo(): KeyGenInfo {
    const start = 0
    const final = this.keyId
    return {
      start,
      final,
      custom: this.customKeys,
    }
  }

  public getAllGeneratedAccounts(): { [k: string]: number } {
    return Object.fromEntries(this.addressesToKeyId)
  }

  public getKeypair(address: AccountId | string): KeyringPair {
    return this.keyring.getPair(address)
  }

  public getSuri(address: AccountId | string): string {
    const suri = this.addressesToSuri.get(address.toString())
    if (!suri) {
      throw new Error(`Suri for address ${address} not available!`)
    }
    return suri
  }
}

export class Api {
  private readonly factory: ApiFactory
  private readonly api: ApiPromise
  private readonly sender: Sender
  // source of funds for all new accounts
  private readonly treasuryAccount: string

  constructor(factory: ApiFactory, api: ApiPromise, treasuryAccount: string, keyring: Keyring, label: string) {
    this.factory = factory
    this.api = api
    this.treasuryAccount = treasuryAccount
    this.sender = new Sender(api, keyring, label)
  }

  public get query(): ApiPromise['query'] {
    return this.api.query
  }

  public get consts(): ApiPromise['consts'] {
    return this.api.consts
  }

  public get tx(): ApiPromise['tx'] {
    return this.api.tx
  }

  public get derive(): ApiPromise['derive'] {
    return this.api.derive
  }

  public get createType(): ApiPromise['createType'] {
    return this.api.createType.bind(this.api)
  }

  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    sender: AccountId | string
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(tx, sender)
  }

  public getAddressFromSuri(suri: string): string {
    return new Keyring({ type: 'sr25519' }).createFromUri(suri).address
  }

  public getKeypair(address: string | AccountId): KeyringPair {
    return this.factory.getKeypair(address)
  }

  public getSuri(address: string | AccountId): string {
    return this.factory.getSuri(address)
  }

  public async sendExtrinsicsAndGetResults(
    // Extrinsics can be separated into batches in order to makes sure they are processed in specified order
    // (each batch will only be processed after the previous one has been fully executed)
    txs: SubmittableExtrinsic<'promise'>[] | SubmittableExtrinsic<'promise'>[][],
    sender: AccountId | string | AccountId[] | string[],
    // Including decremental tip allows ensuring that the submitted transactions within a batch are processed in the expected order
    // even when we're using different accounts
    decrementalTipAmount = 0
  ): Promise<ISubmittableResult[]> {
    let results: ISubmittableResult[] = []
    const batches = (Array.isArray(txs[0]) ? txs : [txs]) as SubmittableExtrinsic<'promise'>[][]
    for (const i in batches) {
      const batch = batches[i]
      results = results.concat(
        await Promise.all(
          batch.map((tx, j) => {
            const tip = Array.isArray(sender) ? decrementalTipAmount * (batch.length - 1 - j) : 0
            return this.sender.signAndSend(
              tx,
              Array.isArray(sender) ? sender[parseInt(i) * batch.length + j] : sender,
              tip
            )
          })
        )
      )
    }
    return results
  }

  public async makeSudoCall(tx: SubmittableExtrinsic<'promise'>): Promise<ISubmittableResult> {
    const sudo = await this.api.query.sudo.key()
    return this.signAndSend(this.api.tx.sudo.sudo(tx), sudo)
  }

  public enableDebugTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Debug)
  }

  public enableVerboseTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Verbose)
  }

  public async createKeyPairs(n: number, withExistentialDeposit = true): Promise<{ key: KeyringPair; id: number }[]> {
    const pairs = this.factory.createKeyPairs(n)
    if (withExistentialDeposit) {
      await Promise.all(pairs.map(({ key }) => this.treasuryTransferBalance(key.address, this.existentialDeposit())))
    }
    return pairs
  }

  public createCustomKeyPair(path: string, finalPath = false): KeyringPair {
    return this.factory.createCustomKeyPair(path, finalPath)
  }

  public keyGenInfo(): KeyGenInfo {
    return this.factory.keyGenInfo()
  }

  public getAllGeneratedAccounts(): { [k: string]: number } {
    return this.factory.getAllGeneratedAccounts()
  }

  public getBlockDuration(): BN {
    return this.api.consts.babe.expectedBlockTime
  }

  public durationInMsFromBlocks(durationInBlocks: number): number {
    return this.getBlockDuration().muln(durationInBlocks).toNumber()
  }

  public getValidatorCount(): Promise<BN> {
    return this.api.query.staking.validatorCount<u32>()
  }

  public getBestBlock(): Promise<BN> {
    return this.api.derive.chain.bestNumber()
  }

  public async getBlockHash(blockNumber: number | BlockNumber): Promise<BlockHash> {
    return this.api.rpc.chain.getBlockHash(blockNumber)
  }

  public async getControllerAccountOfMember(id: MemberId): Promise<string> {
    return (await this.api.query.members.membershipById(id)).controller_account.toString()
  }

  public async getBalance(address: string): Promise<Balance> {
    const accountData: AccountInfo = await this.api.query.system.account<AccountInfo>(address)
    return accountData.data.free
  }

  public async getStakedBalance(address: string | AccountId, lockId?: LockIdentifier | string): Promise<BN> {
    const locks = await this.api.query.balances.locks(address)
    if (lockId) {
      const foundLock = locks.find((l) => l.id.eq(lockId))
      return foundLock ? foundLock.amount : new BN(0)
    }
    return locks.reduce((sum, lock) => sum.add(lock.amount), new BN(0))
  }

  public async transferBalance({
    from,
    to,
    amount,
  }: {
    from: string
    to: string
    amount: BN
  }): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.balances.transfer(to, amount), from)
  }

  public async treasuryTransferBalance(to: string, amount: BN): Promise<ISubmittableResult> {
    return this.transferBalance({ from: this.treasuryAccount, to, amount })
  }

  public treasuryTransferBalanceToAccounts(destinations: string[], amount: BN): Promise<ISubmittableResult[]> {
    return Promise.all(
      destinations.map((account) => this.transferBalance({ from: this.treasuryAccount, to: account, amount }))
    )
  }

  public async prepareAccountsForFeeExpenses(
    accountOrAccounts: string | string[],
    extrinsics: SubmittableExtrinsic<'promise'>[],
    // Including decremental tip allows ensuring that the submitted transactions are processed in the expected order
    // even when we're using different accounts
    decrementalTipAmount = 0
  ): Promise<void> {
    const fees = await Promise.all(
      extrinsics.map((tx, i) =>
        this.estimateTxFee(tx, Array.isArray(accountOrAccounts) ? accountOrAccounts[i] : accountOrAccounts)
      )
    )

    if (Array.isArray(accountOrAccounts)) {
      await Promise.all(
        fees.map((fee, i) =>
          this.treasuryTransferBalance(
            accountOrAccounts[i],
            fee.addn(decrementalTipAmount * (accountOrAccounts.length - 1 - i))
          )
        )
      )
    } else {
      await this.treasuryTransferBalance(
        accountOrAccounts,
        fees.reduce((a, b) => a.add(b), new BN(0))
      )
    }
  }

  public async getMembershipFee(): Promise<BN> {
    return this.api.query.members.membershipPrice()
  }

  public async estimateTxFee(tx: SubmittableExtrinsic<'promise'>, account: string): Promise<Balance> {
    const paymentInfo = await tx.paymentInfo(account)
    return paymentInfo.partialFee
  }

  public existentialDeposit(): Balance {
    return this.api.consts.balances.existentialDeposit
  }

  public findEvent<S extends EventSection, M extends EventMethod<S>>(
    result: ISubmittableResult | EventRecord[],
    section: S,
    method: M
  ): EventType<S, M> | undefined {
    if (Array.isArray(result)) {
      return result.find(({ event }) => event.section === section && event.method === method)?.event as
        | EventType<S, M>
        | undefined
    }
    return result.findRecord(section, method)?.event as EventType<S, M> | undefined
  }

  public getEvent<S extends EventSection, M extends EventMethod<S>>(
    result: ISubmittableResult | EventRecord[],
    section: S,
    method: M
  ): EventType<S, M> {
    const event = this.findEvent(result, section, method)
    if (!event) {
      throw new Error(
        `Cannot find expected ${section}.${method} event in result: ${JSON.stringify(
          Array.isArray(result) ? result.map((e) => e.toHuman()) : result.toHuman()
        )}`
      )
    }
    return event
  }

  public findEvents<S extends EventSection, M extends EventMethod<S>>(
    result: ISubmittableResult | EventRecord[],
    section: S,
    method: M,
    expectedCount?: number
  ): EventType<S, M>[] {
    const events = Array.isArray(result)
      ? result.filter(({ event }) => event.section === section && event.method === method).map(({ event }) => event)
      : result.filterRecords(section, method).map((r) => r.event)
    if (expectedCount && events.length !== expectedCount) {
      throw new Error(
        `Unexpected count of ${section}.${method} events in result: ${JSON.stringify(
          Array.isArray(result) ? result.map((e) => e.toHuman()) : result.toHuman()
        )}. ` + `Expected: ${expectedCount}, Got: ${events.length}`
      )
    }
    return (events.sort((a, b) => new BN(a.index).cmp(new BN(b.index))) as unknown) as EventType<S, M>[]
  }

  public async getEventDetails<S extends EventSection, M extends EventMethod<S>>(
    result: ISubmittableResult,
    section: S,
    method: M
  ): Promise<EventDetails<EventType<S, M>>> {
    const { status } = result
    const event = this.getEvent(result, section, method)

    const blockHash = (status.isInBlock ? status.asInBlock : status.asFinalized).toString()
    const blockNumber = (await this.api.rpc.chain.getHeader(blockHash)).number.toNumber()
    const blockTimestamp = (await this.api.query.timestamp.now.at(blockHash)).toNumber()
    const blockEvents = await this.api.query.system.events.at(blockHash)
    const indexInBlock = blockEvents.findIndex(({ event: blockEvent }) =>
      blockEvent.hash.eq((event as EventType<S, M> & Codec).hash)
    )

    return {
      event,
      blockNumber,
      blockHash,
      blockTimestamp,
      indexInBlock,
    }
  }

  public getErrorNameFromExtrinsicFailedRecord(result: ISubmittableResult): string | undefined {
    const failed = result.findRecord('system', 'ExtrinsicFailed')
    if (!failed) {
      return
    }
    const record = failed as EventRecord
    const {
      event: { data },
    } = record
    const err = data[0] as DispatchError
    if (err.isModule) {
      try {
        const { name } = this.api.registry.findMetaError(err.asModule)
        return name
      } catch (findmetaerror) {
        //
      }
    }
  }

  public async getOpening(group: WorkingGroupModuleName, id: OpeningId): Promise<Opening> {
    const opening = await this.api.query[group].openingById(id)
    if (opening.isEmpty) {
      throw new Error(`Opening by id ${id} not found!`)
    }
    return opening
  }

  public async getLeader(group: WorkingGroupModuleName): Promise<[WorkerId, Worker]> {
    const leadId = await this.api.query[group].currentLead()
    if (leadId.isNone) {
      throw new Error(`Cannot get ${group} lead: Lead not hired!`)
    }
    return [leadId.unwrap(), await this.api.query[group].workerById(leadId.unwrap())]
  }

  public async getActiveWorkerIds(group: WorkingGroupModuleName): Promise<WorkerId[]> {
    return (await this.api.query[group].workerById.entries<Worker>()).map(
      ([
        {
          args: [id],
        },
      ]) => id
    )
  }

  public async getWorkerRoleAccounts(workerIds: WorkerId[], module: WorkingGroupModuleName): Promise<string[]> {
    const workers = await this.api.query[module].workerById.multi<Worker>(workerIds)

    return workers.map((worker) => {
      return worker.role_account_id.toString()
    })
  }

  public async getLeadRoleKey(group: WorkingGroupModuleName): Promise<string> {
    return (await this.getLeader(group))[1].role_account_id.toString()
  }

  public async getLeaderStakingKey(group: WorkingGroupModuleName): Promise<string> {
    return (await this.getLeader(group))[1].staking_account_id.toString()
  }

  public async getMemberSigners(inputs: { asMember: MemberId }[]): Promise<string[]> {
    return await Promise.all(
      inputs.map(async ({ asMember }) => {
        const membership = await this.query.members.membershipById(asMember)
        return membership.controller_account.toString()
      })
    )
  }

  public async untilBlock(blockNumber: number, intervalMs = BLOCKTIME, timeoutMs = 180000): Promise<void> {
    await Utils.until(
      `blocknumber ${blockNumber}`,
      async ({ debug }) => {
        const best = await this.getBestBlock()
        debug(`Current block: ${best.toNumber()}`)
        return best.gten(blockNumber)
      },
      intervalMs,
      timeoutMs
    )
  }

  public async untilProposalsCanBeCreated(
    numberOfProposals = 1,
    intervalMs = BLOCKTIME,
    timeoutMs = 180000
  ): Promise<void> {
    await Utils.until(
      `${numberOfProposals} proposals can be created`,
      async ({ debug }) => {
        const { maxActiveProposalLimit } = this.consts.proposalsEngine
        const activeProposalsN = await this.query.proposalsEngine.activeProposalCount()
        debug(`Currently active proposals: ${activeProposalsN.toNumber()}/${maxActiveProposalLimit.toNumber()}`)
        return maxActiveProposalLimit.sub(activeProposalsN).toNumber() >= numberOfProposals
      },
      intervalMs,
      timeoutMs
    )
  }

  public async untilCouncilStage(
    targetStage: 'Announcing' | 'Voting' | 'Revealing' | 'Idle',
    announcementPeriodNr: number | null = null,
    blocksReserve = 4,
    intervalMs = BLOCKTIME
  ): Promise<void> {
    await Utils.until(
      `council stage ${targetStage} (+${blocksReserve} blocks reserve)`,
      async ({ debug }) => {
        const currentCouncilStage = await this.query.council.stage()
        const currentElectionStage = await this.query.referendum.stage()
        const currentStage = currentCouncilStage.stage.isOfType('Election')
          ? (currentElectionStage.type as 'Voting' | 'Revealing')
          : (currentCouncilStage.stage.type as 'Announcing' | 'Idle')
        const currentStageStartedAt = currentCouncilStage.stage.isOfType('Election')
          ? currentElectionStage.asType(currentElectionStage.type as 'Voting' | 'Revealing').started
          : currentCouncilStage.changed_at

        const currentBlock = await this.getBestBlock()
        const { announcingPeriodDuration, idlePeriodDuration } = this.consts.council
        const { voteStageDuration, revealStageDuration } = this.consts.referendum
        const durationByStage = {
          'Announcing': announcingPeriodDuration,
          'Voting': voteStageDuration,
          'Revealing': revealStageDuration,
          'Idle': idlePeriodDuration,
        } as const

        const currentStageEndsIn = currentStageStartedAt.add(durationByStage[currentStage]).sub(currentBlock)

        const currentAnnouncementPeriodNr =
          announcementPeriodNr === null ? null : (await this.api.query.council.announcementPeriodNr()).toNumber()

        debug(`Current stage: ${currentStage}, blocks left: ${currentStageEndsIn.toNumber()}`)

        return (
          currentStage === targetStage &&
          currentStageEndsIn.gten(blocksReserve) &&
          announcementPeriodNr === currentAnnouncementPeriodNr
        )
      },
      intervalMs
    )
  }

  public proposalParametersByType(type: ProposalType): ProposalParameters {
    return this.api.consts.proposalsCodex[proposalTypeToProposalParamsKey[type]]
  }

  lockIdByGroup(group: WorkingGroupModuleName): LockIdentifier {
    return this.api.consts[group].stakingHandlerLockId
  }

  async getMemberControllerAccount(memberId: number): Promise<string | undefined> {
    return (await this.api.query.members.membershipById(memberId))?.controller_account.toString()
  }

  public async getNumberOfOutstandingVideos(): Promise<number> {
    return (await this.api.query.content.videoById.entries<VideoId>()).length
  }

  public async getNumberOfOutstandingChannels(): Promise<number> {
    return (await this.api.query.content.channelById.entries<ChannelId>()).length
  }

  public async getNumberOfOutstandingVideoCategories(): Promise<number> {
    return (await this.api.query.content.videoCategoryById.entries<VideoCategoryId>()).length
  }

  // Create a mock channel, throws on failure
  async createMockChannel(memberId: number, memberControllerAccount?: string): Promise<ChannelId> {
    memberControllerAccount = memberControllerAccount || (await this.getMemberControllerAccount(memberId))

    if (!memberControllerAccount) {
      throw new Error('invalid member id')
    }

    // Create a channel without any assets
    const tx = this.api.tx.content.createChannel(
      { Member: memberId },
      {
        assets: null,
        meta: null,
        reward_account: null,
      }
    )

    const result = await this.sender.signAndSend(tx, memberControllerAccount)

    const event = this.getEvent(result.events, 'content', 'ChannelCreated')
    return event.data[1]
  }

  // Create a mock video, throws on failure
  async createMockVideo(memberId: number, channelId: number, memberControllerAccount?: string): Promise<VideoId> {
    memberControllerAccount = memberControllerAccount || (await this.getMemberControllerAccount(memberId))

    if (!memberControllerAccount) {
      throw new Error('invalid member id')
    }

    // Create a video without any assets
    const tx = this.api.tx.content.createVideo({ Member: memberId }, channelId, {
      assets: null,
      meta: null,
    })

    const result = await this.sender.signAndSend(tx, memberControllerAccount)

    const event = this.getEvent(result.events, 'content', 'VideoCreated')
    return event.data[2]
  }

  async createChannelCategoryAsLead(name: string): Promise<ISubmittableResult> {
    const [, lead] = await this.getLeader('contentWorkingGroup')

    const account = lead.role_account_id
    const meta = new ChannelCategoryMetadata({
      name,
    })

    return this.sender.signAndSend(
      this.api.tx.content.createChannelCategory(
        { Lead: null },
        { meta: Utils.metadataToBytes(ChannelCategoryMetadata, meta) }
      ),
      account?.toString()
    )
  }

  async createVideoCategoryAsLead(name: string): Promise<ISubmittableResult> {
    const [, lead] = await this.getLeader('contentWorkingGroup')

    const account = lead.role_account_id
    const meta = new VideoCategoryMetadata({
      name,
    })

    return this.sender.signAndSend(
      this.api.tx.content.createVideoCategory(
        { Lead: null },
        { meta: Utils.metadataToBytes(VideoCategoryMetadata, meta) }
      ),
      account?.toString()
    )
  }

  async assignWorkerRoleAccount(
    group: WorkingGroupModuleName,
    workerId: WorkerId,
    account: string
  ): Promise<ISubmittableResult> {
    const worker = await this.api.query[group].workerById(workerId)
    if (worker.isEmpty) {
      throw new Error(`Worker not found by id: ${workerId}!`)
    }

    const memberController = await this.getControllerAccountOfMember(worker.member_id)
    // there cannot be a worker associated with member that does not exist
    if (!memberController) {
      throw new Error('Member controller not found')
    }

    // Expect membercontroller key is already added to keyring
    // Is is responsibility of caller to ensure this is the case!

    const updateRoleAccountCall = this.api.tx[group].updateRoleAccount(workerId, account)
    await this.prepareAccountsForFeeExpenses(memberController, [updateRoleAccountCall])
    return this.sender.signAndSend(updateRoleAccountCall, memberController)
  }

  async assignWorkerWellknownAccount(
    group: WorkingGroupModuleName,
    workerId: WorkerId,
    initialBalance = KNOWN_WORKER_ROLE_ACCOUNT_DEFAULT_BALANCE
  ): Promise<ISubmittableResult[]> {
    // path to append to base SURI
    const uri = `worker//${workingGroupNameByModuleName[group]}//${workerId.toNumber()}`
    const account = this.createCustomKeyPair(uri).address
    return Promise.all([
      this.assignWorkerRoleAccount(group, workerId, account),
      this.treasuryTransferBalance(account, initialBalance),
    ])
  }

  // Storage

  async createStorageBucket(
    accountFrom: string, // group leader
    sizeLimit: number,
    objectsLimit: number,
    workerId?: WorkerId
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      this.api.tx.storage.createStorageBucket(workerId || null, true, sizeLimit, objectsLimit),
      accountFrom
    )
  }

  async acceptStorageBucketInvitation(accountFrom: string, workerId: WorkerId, storageBucketId: StorageBucketId) {
    return this.sender.signAndSend(
      this.api.tx.storage.acceptStorageBucketInvitation(workerId, storageBucketId, accountFrom),
      accountFrom
    )
  }

  async updateStorageBucketsForBag(
    accountFrom: string, // group leader
    channelId: string,
    addStorageBuckets: StorageBucketId[]
  ) {
    return this.sender.signAndSend(
      this.api.tx.storage.updateStorageBucketsForBag(
        this.api.createType('BagId', { Dynamic: { Channel: channelId } }),
        this.api.createType('BTreeSet<StorageBucketId>', [addStorageBuckets.map((item) => item.toString())]),
        this.api.createType('BTreeSet<StorageBucketId>', [])
      ),
      accountFrom
    )
  }

  async updateStorageBucketsPerBagLimit(
    accountFrom: string, // group leader
    limit: number
  ) {
    return this.sender.signAndSend(this.api.tx.storage.updateStorageBucketsPerBagLimit(limit), accountFrom)
  }

  async updateStorageBucketsVoucherMaxLimits(
    accountFrom: string, // group leader
    sizeLimit: number,
    objectLimit: number
  ) {
    return this.sender.signAndSend(
      this.api.tx.storage.updateStorageBucketsVoucherMaxLimits(sizeLimit, objectLimit),
      accountFrom
    )
  }

  async acceptPendingDataObjects(
    accountFrom: string,
    workerId: WorkerId,
    storageBucketId: StorageBucketId,
    channelId: string,
    dataObjectIds: string[]
  ): Promise<ISubmittableResult> {
    const bagId = { Dynamic: { Channel: channelId } }
    const encodedDataObjectIds = new BTreeSet<DataObjectId>(this.api.registry, 'DataObjectId', dataObjectIds)

    return this.sender.signAndSend(
      this.api.tx.storage.acceptPendingDataObjects(workerId, storageBucketId, bagId, encodedDataObjectIds),
      accountFrom
    )
  }

  async issueNft(
    accountFrom: string,
    memberId: number,
    videoId: number,
    metadata = '',
    royaltyPercentage?: number,
    toMemberId?: number | null
  ): Promise<ISubmittableResult> {
    const perbillOnePercent = 10 * 1000000

    const royalty = this.api.createType(
      'Option<Royalty>',
      royaltyPercentage ? royaltyPercentage * perbillOnePercent : null
    )
    // TODO: find proper way to encode metadata (should they be raw string, hex string or some object?)
    // const encodedMetadata = this.api.createType('Metadata', metadata)
    // const encodedMetadata = this.api.createType('Metadata', metadata).toU8a() // invalid type passed to Metadata constructor
    // const encodedMetadata = this.api.createType('Vec<u8>', metadata)
    // const encodedMetadata = this.api.createType('Vec<u8>', 'someNonEmptyText') // decodeU8a: failed at 0x736f6d654e6f6e45… on magicNumber: u32:: MagicNumber mismatch: expected 0x6174656d, found 0x656d6f73
    // const encodedMetadata = this.api.createType('Bytes', 'someNonEmptyText') // decodeU8a: failed at 0x736f6d654e6f6e45… on magicNumber: u32:: MagicNumber mismatch: expected 0x6174656d, found 0x656d6f73
    // const encodedMetadata = this.api.createType('Metadata', {})
    // const encodedMetadata = this.api.createType('Bytes', '0x') // error
    // const encodedMetadata = this.api.createType('NftMetadata', 'someNonEmptyText')
    // const encodedMetadata = this.api.createType('NftMetadata', 'someNonEmptyText').toU8a() // createType(NftMetadata) // Vec length 604748352930462863646034177481338223 exceeds 65536
    const encodedMetadata = this.api.createType('NftMetadata', '').toU8a() // THIS IS OK!!! but only for empty string :-\
    // try this later on // const encodedMetadata = this.api.createType('Vec<u8>', 'someNonEmptyText').toU8a()
    // const encodedMetadata = this.api.createType('Vec<u8>', 'someNonEmptyText').toU8a() // throws error in QN when decoding this (but mb QN error)

    const encodedToAccount = this.api.createType('Option<MemberId>', toMemberId || memberId)

    const issuanceParameters = this.api.createType('NftIssuanceParameters', {
      royalty,
      nft_metadata: encodedMetadata,
      non_channel_owner: encodedToAccount,
      init_transactional_status: this.api.createType('InitTransactionalStatus', { Idle: null }),
    })

    return await this.sender.signAndSend(
      this.api.tx.content.issueNft({ Member: memberId }, videoId, issuanceParameters),
      accountFrom
    )
  }

  private async getAuctionParametersBoundaries() {
    const boundaries = {
      extensionPeriod: {
        min: await this.api.query.content.minAuctionExtensionPeriod(),
        max: await this.api.query.content.maxAuctionExtensionPeriod(),
      },
      auctionDuration: {
        min: await this.api.query.content.minAuctionDuration(),
        max: await this.api.query.content.maxAuctionDuration(),
      },
      bidLockDuration: {
        min: await this.api.query.content.minBidLockDuration(),
        max: await this.api.query.content.maxBidLockDuration(),
      },
      startingPrice: {
        min: await this.api.query.content.minStartingPrice(),
        max: await this.api.query.content.maxStartingPrice(),
      },
      bidStep: {
        min: await this.api.query.content.minBidStep(),
        max: await this.api.query.content.maxBidStep(),
      },
    }

    return boundaries
  }

  async createAuctionParameters(
    auctionType: 'English' | 'Open',
    whitelist: string[] = [],
    auctionDuration?: BN,
    extensionPeriod?: BN
  ): Promise<{
    auctionParams: AuctionParams
    startingPrice: BN
    minimalBidStep: BN
    bidLockDuration: BN
    extensionPeriod: BN
    auctionDuration: BN
  }> {
    const boundaries = await this.getAuctionParametersBoundaries()

    // auction duration must be larger than extension period (enforced in runtime)
    auctionDuration = auctionDuration || BN.max(boundaries.auctionDuration.min, boundaries.extensionPeriod.min)
    extensionPeriod = extensionPeriod || boundaries.extensionPeriod.min

    if (extensionPeriod && auctionDuration && extensionPeriod >= auctionDuration) {
      throw new Error('Auction duration must be larger than extension period')
    }

    const encodedAuctionType =
      auctionType === 'English'
        ? {
            English: {
              extension_period: extensionPeriod,
              auction_duration: auctionDuration,
            },
          }
        : {
            Open: {
              bid_lock_duration: boundaries.bidLockDuration.min,
            },
          }

    const auctionParams = this.api.createType('AuctionParams', {
      auction_type: this.api.createType('AuctionType', encodedAuctionType),
      starting_price: this.api.createType('u128', boundaries.startingPrice.min),
      minimal_bid_step: this.api.createType('u128', boundaries.bidStep.min),
      buy_now_price: this.api.createType('Option<BlockNumber>', null),
      starts_at: this.api.createType('Option<BlockNumber>', null),
      whitelist: this.api.createType('BTreeSet<StorageBucketId>', whitelist),
    })

    return {
      auctionParams,
      startingPrice: boundaries.startingPrice.min,
      minimalBidStep: boundaries.bidStep.min,
      bidLockDuration: boundaries.bidLockDuration.min,
      extensionPeriod: boundaries.extensionPeriod.min,
      auctionDuration: auctionDuration,
    }
  }

  async startNftAuction(
    accountFrom: string,
    memberId: number,
    videoId: number,
    auctionParams: AuctionParams
  ): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(
      this.api.tx.content.startNftAuction({ Member: memberId }, videoId, auctionParams),
      accountFrom
    )
  }

  async bidInNftAuction(
    accountFrom: string,
    memberId: number,
    videoId: number,
    bidAmount: BN
  ): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(this.api.tx.content.makeBid(memberId, videoId, bidAmount), accountFrom)
  }

  async claimWonEnglishAuction(accountFrom: string, memberId: number, videoId: number): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(this.api.tx.content.claimWonEnglishAuction(memberId, videoId), accountFrom)
  }

  async pickOpenAuctionWinner(accountFrom: string, memberId: number, videoId: number): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(
      this.api.tx.content.pickOpenAuctionWinner({ Member: memberId }, videoId),
      accountFrom
    )
  }

  async cancelOpenAuctionBid(accountFrom: string, participantId: number, videoId: number): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(this.api.tx.content.cancelOpenAuctionBid(participantId, videoId), accountFrom)
  }

  async cancelNftAuction(accountFrom: string, ownerId: number, videoId: number): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(
      this.api.tx.content.cancelNftAuction({ Member: ownerId }, videoId),
      accountFrom
    )
  }

  async sellNft(accountFrom: string, videoId: number, ownerId: number, price: BN): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(this.api.tx.content.sellNft(videoId, { Member: ownerId }, price), accountFrom)
  }

  async buyNft(accountFrom: string, videoId: number, participantId: number, price: BN): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(this.api.tx.content.buyNft(videoId, participantId, price), accountFrom)
  }

  async offerNft(
    accountFrom: string,
    videoId: number,
    ownerId: number,
    toMemberId: number,
    price: BN | null = null
  ): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(
      this.api.tx.content.offerNft(videoId, { Member: ownerId }, toMemberId, price),
      accountFrom
    )
  }

  async acceptIncomingOffer(accountFrom: string, videoId: number): Promise<ISubmittableResult> {
    return await this.sender.signAndSend(this.api.tx.content.acceptIncomingOffer(videoId), accountFrom)
  }

  async createVideoWithNftAuction(
    accountFrom: string,
    ownerId: number,
    channeld: number,
    auctionParams: AuctionParams
  ): Promise<ISubmittableResult> {
    const createParameters = this.createType('VideoCreationParameters', {
      assets: null,
      meta: null,
      enable_comments: false,
      auto_issue_nft: this.api.createType('NftIssuanceParameters', {
        royalty: null,
        nft_metadata: this.api.createType('NftMetadata', '').toU8a(),
        non_channel_owner: ownerId,
        init_transactional_status: this.api.createType('InitTransactionalStatus', { Auction: auctionParams }),
      }),
    })

    return await this.sender.signAndSend(
      this.api.tx.content.createVideo({ Member: ownerId }, channeld, createParameters),
      accountFrom
    )
  }

  async updateVideoForNftCreation(
    accountFrom: string,
    ownerId: number,
    videoId: number,
    auctionParams: AuctionParams
  ): Promise<ISubmittableResult> {
    const updateParameters = this.createType('VideoUpdateParameters', {
      assets_to_upload: null,
      new_meta: null,
      assets_to_remove: this.api.createType('BTreeSet<DataObjectId>', []),
      enable_comments: false,
      auto_issue_nft: this.api.createType('NftIssuanceParameters', {
        royalty: null,
        nft_metadata: this.api.createType('NftMetadata', '').toU8a(),
        non_channel_owner: ownerId,
        init_transactional_status: this.api.createType('InitTransactionalStatus', { Auction: auctionParams }),
      }),
    })

    return await this.sender.signAndSend(
      this.api.tx.content.updateVideo({ Member: ownerId }, videoId, updateParameters),
      accountFrom
    )
  }

  public setFaucetInfo(info: FaucetInfo): void {
    this.factory.setFaucetInfo(info)
  }

  public getFaucetInfo(): FaucetInfo {
    return this.factory.faucetInfo
  }
}
