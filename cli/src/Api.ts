import BN from 'bn.js'
import { types } from '@joystream/types/'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { AugmentedQuery, SubmittableExtrinsic } from '@polkadot/api/types'
import { AnyFunction, Codec } from '@polkadot/types/types'
import { formatBalance } from '@polkadot/util'
import { Balance } from '@polkadot/types/interfaces'
import { KeyringPair } from '@polkadot/keyring/types'

import {
  AccountSummary,
  CouncilInfoObj,
  CouncilInfoTuple,
  createCouncilInfoObj,
  WorkingGroups,
  workingGroupKeyByGroup,
} from './Types'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { CLIError } from '@oclif/errors'
import ExitCodes from './ExitCodes'
import { Worker, WorkerId, StorageProviderId } from '@joystream/types/working-group'
import { MemberId } from '@joystream/types/members'
import { InputValidationLengthConstraint } from '@joystream/types/common'

import { Class, ClassId, CuratorGroup, CuratorGroupId, Entity, EntityId } from '@joystream/types/content-directory'
import { ContentId, DataObject } from '@joystream/types/media'
import { ServiceProviderRecord } from '@joystream/types/discovery'
import _ from 'lodash'

import Transport from '@joystream/js/transport'
import { entriesByIds } from '@joystream/js/transport/base'
import { ParsedApplication, ParsedOpening, WorkerData } from '@joystream/js/types/workingGroups'

export const DEFAULT_API_URI = 'ws://localhost:9944/'
const DEFAULT_DECIMALS = new BN(12)

// Mapping of working group to api module
export const apiModuleByGroup: { [key in WorkingGroups]: string } = {
  [WorkingGroups.StorageProviders]: 'storageWorkingGroup',
  [WorkingGroups.Curators]: 'contentDirectoryWorkingGroup',
}

// Api wrapper for handling most common api calls and allowing easy API implementation switch in the future
export default class Api {
  private _api: ApiPromise
  private _transport: Transport
  private _cdClassesCache: [ClassId, Class][] | null = null

  private constructor(originalApi: ApiPromise) {
    this._api = originalApi
    this._transport = new Transport(this._api)
  }

  public getOriginalApi(): ApiPromise {
    return this._api
  }

  private static async initApi(
    apiUri: string = DEFAULT_API_URI,
    metadataCache: Record<string, any>
  ): Promise<ApiPromise> {
    const wsProvider: WsProvider = new WsProvider(apiUri)
    const api = await ApiPromise.create({ provider: wsProvider, types, metadata: metadataCache })

    // Initializing some api params based on pioneer/packages/react-api/Api.tsx
    const [properties] = await Promise.all([api.rpc.system.properties()])

    const tokenSymbol = properties.tokenSymbol.unwrapOr('DEV').toString()
    const tokenDecimals = properties.tokenDecimals.unwrapOr(DEFAULT_DECIMALS).toNumber()

    // formatBlanace config
    formatBalance.setDefaults({
      decimals: tokenDecimals,
      unit: tokenSymbol,
    })

    return api
  }

  static async create(apiUri: string = DEFAULT_API_URI, metadataCache: Record<string, any>): Promise<Api> {
    const originalApi: ApiPromise = await Api.initApi(apiUri, metadataCache)
    return new Api(originalApi)
  }

  private queryMultiOnce(queries: AugmentedQuery<'promise', AnyFunction>[]): Promise<Codec[]> {
    return new Promise((resolve, reject) => {
      let unsub: () => void
      this._api
        .queryMulti(queries, (res) => {
          // unsub should already be set at this point
          if (!unsub) {
            reject(new CLIError('API queryMulti issue - unsub method not set!', { exit: ExitCodes.ApiError }))
          }
          unsub()
          resolve(res)
        })
        .then((unsubscribe) => (unsub = unsubscribe))
        .catch((e) => reject(e))
    })
  }

  async bestNumber(): Promise<number> {
    return (await this._api.derive.chain.bestNumber()).toNumber()
  }

  async getAccountsBalancesInfo(accountAddresses: string[]): Promise<DeriveBalancesAll[]> {
    const accountsBalances: DeriveBalancesAll[] = await Promise.all(
      accountAddresses.map((addr) => this._api.derive.balances.all(addr))
    )

    return accountsBalances
  }

  // Get on-chain data related to given account.
  // For now it's just account balances
  async getAccountSummary(accountAddresses: string): Promise<AccountSummary> {
    const balances: DeriveBalancesAll = (await this.getAccountsBalancesInfo([accountAddresses]))[0]
    // TODO: Some more information can be fetched here in the future

    return { balances }
  }

  async getCouncilInfo(): Promise<CouncilInfoObj> {
    const queries = {
      activeCouncil: this._transport.query.council.activeCouncil,
      termEndsAt: this._transport.query.council.termEndsAt,
      autoStart: this._transport.query.councilElection.autoStart,
      newTermDuration: this._transport.query.councilElection.newTermDuration,
      candidacyLimit: this._transport.query.councilElection.candidacyLimit,
      councilSize: this._transport.query.councilElection.councilSize,
      minCouncilStake: this._transport.query.councilElection.minCouncilStake,
      minVotingStake: this._transport.query.councilElection.minVotingStake,
      announcingPeriod: this._transport.query.councilElection.announcingPeriod,
      votingPeriod: this._transport.query.councilElection.votingPeriod,
      revealingPeriod: this._transport.query.councilElection.revealingPeriod,
      round: this._transport.query.councilElection.round,
      stage: this._transport.query.councilElection.stage,
    }
    const results: CouncilInfoTuple = (await this.queryMultiOnce(Object.values(queries))) as CouncilInfoTuple

    return createCouncilInfoObj(...results)
  }

  async estimateFee(account: KeyringPair, tx: SubmittableExtrinsic<'promise'>): Promise<Balance> {
    const paymentInfo = await tx.paymentInfo(account)
    return paymentInfo.partialFee
  }

  createTransferTx(recipient: string, amount: BN) {
    return this._transport.tx.balances.transfer(recipient, amount)
  }

  // Working groups

  protected async blockTimestamp(height: number): Promise<Date> {
    return this._transport.chain.blockTimestamp(height)
  }

  async groupLead(group: WorkingGroups): Promise<WorkerData | null> {
    return this._transport.workingGroups.currentLead(workingGroupKeyByGroup[group])
  }

  async workerByWorkerId(group: WorkingGroups, workerId: number): Promise<Worker> {
    return this._transport.workingGroups.workerById(workingGroupKeyByGroup[group], workerId)
  }

  async groupMember(group: WorkingGroups, workerId: number): Promise<WorkerData> {
    return this._transport.workingGroups.groupMemberById(workingGroupKeyByGroup[group], workerId)
  }

  async groupMembers(group: WorkingGroups): Promise<WorkerData[]> {
    return this._transport.workingGroups.groupMembers(workingGroupKeyByGroup[group])
  }

  groupWorkers(group: WorkingGroups): Promise<[WorkerId, Worker][]> {
    return this._transport.workingGroups.allWorkers(workingGroupKeyByGroup[group])
  }

  async openingsByGroup(group: WorkingGroups): Promise<ParsedOpening[]> {
    return this._transport.workingGroups.parsedOpenings(workingGroupKeyByGroup[group])
  }

  async groupApplication(group: WorkingGroups, wgApplicationId: number): Promise<ParsedApplication> {
    return this._transport.workingGroups.parsedApplicationById(workingGroupKeyByGroup[group], wgApplicationId)
  }

  async groupOpening(group: WorkingGroups, wgOpeningId: number): Promise<ParsedOpening> {
    return this._transport.workingGroups.parsedOpening(workingGroupKeyByGroup[group], wgOpeningId)
  }

  async getMemberIdsByControllerAccount(address: string): Promise<MemberId[]> {
    return this._transport.members.idsByController(address)
  }

  async workerExitRationaleConstraint(group: WorkingGroups): Promise<InputValidationLengthConstraint> {
    return await this._transport.workingGroups.workerExitRationaleConstraint(workingGroupKeyByGroup[group])
  }

  // Content directory
  async availableClasses(useCache = true): Promise<[ClassId, Class][]> {
    return useCache && this._cdClassesCache
      ? this._cdClassesCache
      : (this._cdClassesCache = await entriesByIds<ClassId, Class>(this._transport.query.contentDirectory.classById))
  }

  availableCuratorGroups(): Promise<[CuratorGroupId, CuratorGroup][]> {
    return entriesByIds<CuratorGroupId, CuratorGroup>(this._transport.query.contentDirectory.curatorGroupById)
  }

  async curatorGroupById(id: number): Promise<CuratorGroup | null> {
    const exists = !!(await this._transport.query.contentDirectory.curatorGroupById.size(id)).toNumber()
    return exists ? await this._transport.query.contentDirectory.curatorGroupById(id) : null
  }

  async nextCuratorGroupId(): Promise<number> {
    return (await this._transport.query.contentDirectory.nextCuratorGroupId()).toNumber()
  }

  async classById(id: number): Promise<Class | null> {
    const c = await this._transport.query.contentDirectory.classById(id)
    return c.isEmpty ? null : c
  }

  async entitiesByClassId(classId: number): Promise<[EntityId, Entity][]> {
    const entityEntries = await entriesByIds<EntityId, Entity>(this._transport.query.contentDirectory.entityById)
    return entityEntries.filter(([, entity]) => entity.class_id.toNumber() === classId)
  }

  async entityById(id: number): Promise<Entity | null> {
    const exists = !!(await this._transport.query.contentDirectory.curatorGroupById.size(id))
    return exists ? await this._transport.query.contentDirectory.entityById(id) : null
  }

  async dataObjectByContentId(contentId: ContentId): Promise<DataObject | null> {
    const dataObject = await this._transport.query.dataDirectory.dataObjectByContentId(contentId)
    return dataObject.unwrapOr(null)
  }

  async ipnsIdentity(storageProviderId: number): Promise<string | null> {
    const accountInfo = await this._transport.query.discovery.accountInfoByStorageProviderId(storageProviderId)
    return accountInfo.isEmpty || accountInfo.expires_at.toNumber() <= (await this.bestNumber())
      ? null
      : accountInfo.identity.toString()
  }

  async getRandomBootstrapEndpoint(): Promise<string | null> {
    const endpoints = await this._transport.query.discovery.bootstrapEndpoints()
    const randomEndpoint = _.sample(endpoints.toArray())
    return randomEndpoint ? randomEndpoint.toString() : null
  }

  async isAnyProviderAvailable(): Promise<boolean> {
    const accounInfoEntries = await entriesByIds<StorageProviderId, ServiceProviderRecord>(
      this._transport.query.discovery.accountInfoByStorageProviderId
    )

    const bestNumber = await this.bestNumber()
    return !!accounInfoEntries.filter(([, info]) => info.expires_at.toNumber() > bestNumber).length
  }
}
