import { Observable } from 'rxjs';
import ApiPromise from '@polkadot/api/promise';
import { Balance } from '@polkadot/types/interfaces'
import { GenericAccountId, Option, u32, u128, Vec } from '@polkadot/types'
import { Moment } from '@polkadot/types/interfaces/runtime';
import { Codec } from '@polkadot/types/types'

import { LinkedMapEntry } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { Subscribable, Transport as TransportBase } from '@polkadot/joy-utils/index'

import { Actor, Role } from '@joystream/types/roles';
import { OpeningId } from '@joystream/types/hiring';
import { CuratorOpening, Lead, LeadId } from '@joystream/types/content-working-group';
import { Opening } from '@joystream/types/hiring';

import { WorkingGroupMembership, StorageAndDistributionMembership } from "./tabs/WorkingGroup"
import { WorkingGroupOpening } from "./tabs/Opportunities"
import { ActiveRole, OpeningApplication } from "./tabs/MyRoles"

import { keyPairDetails } from './flows/apply'

import { classifyOpeningStage } from "./classifiers"
import { ApplicationStakeRequirement, RoleStakeRequirement, StakeType } from './StakeRequirement'
import { WorkingGroups } from "./working_groups"

export class Transport extends TransportBase implements ITransport {
  protected api: ApiPromise

  constructor(api: ApiPromise) {
    super()
    this.api = api
  }

  async roles(): Promise<Array<Role>> {
    const roles: any = await this.api.query.actors.availableRoles()
    return this.promise<Array<Role>>(roles.map((role: Role) => role))
  }

  curationGroup(): Promise<WorkingGroupMembership> {
    // Imagine this queried the API!
    // TODO: Make this query the API
    return this.promise<WorkingGroupMembership>({} as WorkingGroupMembership)
  }

  storageGroup(): Promise<StorageAndDistributionMembership> {
    return this.promise<StorageAndDistributionMembership>(
      {} as StorageAndDistributionMembership,
    )
  }

  currentOpportunities(): Promise<Array<WorkingGroupOpening>> {
    return this.promise<Array<WorkingGroupOpening>>(
      [],
    )
  }

  protected async opening(id: number): Promise<Opening> {
    return new Promise<Opening>(async (resolve, reject) => {
      const opening = new LinkedMapEntry<Opening>(
        Opening,
        await this.api.query.hiring.openingById(id),
      )
      resolve(opening.value)
    })
  }

  async curationGroupOpening(id: number): Promise<WorkingGroupOpening> {
    return new Promise<WorkingGroupOpening>(async (resolve, reject) => {
      const nextId = (await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as u32).toNumber()
      if (id < 0 || id >= nextId) {
        reject("invalid id")
      }

      const curatorOpening = new LinkedMapEntry<CuratorOpening>(
        CuratorOpening,
        await this.api.query.contentWorkingGroup.curatorOpeningById(id),
      )

      const opening = await this.opening(
        curatorOpening.value.getField<OpeningId>("opening_id").toNumber()
      )

      /////////////////////////////////
      // TODO: Load group lead
      const currentLeadId = await this.api.query.contentWorkingGroup.currentLeadId() as Option<LeadId>

      if (currentLeadId.isNone) {
        reject("no current lead id")
      }

      const lead = new LinkedMapEntry<Lead>(
        Lead,
        await this.api.query.contentWorkingGroup.leadById(
          currentLeadId.unwrap(),
        ),
      )

      const leadAccount = lead.value.getField<GenericAccountId>("role_account")

      const memberIds = await this.api.query.members.memberIdsByRootAccountId(leadAccount) as Vec<GenericAccountId>
      if (memberIds.length == 0) {
        reject("no member account found")
      }

      const memberId = memberIds[0]

      const profile = await this.api.query.members.memberProfile(memberId) as Option<Codec>
      if (profile.isNone) {
        reject("no profile found")
      }

      const actor = new Actor({
        member_id: memberId,
        account: leadAccount,
      })

      // @ts-ignore
      resolve({
        creator: {
          actor: actor,
          profile: profile.unwrap(),
          title: 'Group lead',
          lead: true,
          //stake?: Balance,
          //earned?: Balance,
        },
        opening: opening,
        meta: {
          id: id.toString(),
          group: WorkingGroups.ContentCurators,
        },
        stage: await classifyOpeningStage(this, opening),

        //// MOCK data //
        /*	  stage: {
            state: OpeningState.AcceptingApplications,
            starting_block: 100,
            starting_block_hash: "somehash",
            starting_time: new Date(),
          },*/
        applications: {
          numberOfApplications: 0,
          maxNumberOfApplications: 0,
          requiredApplicationStake: new ApplicationStakeRequirement(
            new u128(501),
            StakeType.AtLeast,
          ),
          requiredRoleStake: new RoleStakeRequirement(
            new u128(502),
          ),
          defactoMinimumStake: new u128(0),
        },
        defactoMinimumStake: new u128(0)
      })
    })
  }

  openingApplicationRanks(openingId: string): Promise<Balance[]> {
    return this.promise<Balance[]>([])
  }

  expectedBlockTime(): Promise<number> {
    return this.promise<number>(
      // @ts-ignore
      this.api.consts.babe.expectedBlockTime.toNumber() / 1000
    )
  }

  async blockHash(height: number): Promise<string> {
    const blockHash = await this.api.query.system.blockHash(height)
    return blockHash.toString()
  }

  async blockTimestamp(height: number): Promise<Date> {
    const blockTime = await this.api.query.timestamp.now.at(
      await this.blockHash(height)
    ) as Moment

    return new Date(blockTime.toNumber())
  }

  transactionFee(): Promise<Balance> {
    return this.promise<Balance>(new u128(5))
  }
  accounts(): Subscribable<keyPairDetails[]> {
    return new Observable<keyPairDetails[]>((observer) => {
    })
  }

  openingApplications(): Subscribable<OpeningApplication[]> {
    return new Observable<OpeningApplication[]>(observer => {
    }
    )
  }

  myCurationGroupRoles(): Subscribable<ActiveRole[]> {
    return new Observable<ActiveRole[]>(observer => {
    }
    )
  }

  myStorageGroupRoles(): Subscribable<ActiveRole[]> {
    return new Observable<ActiveRole[]>(observer => {
    }
    )
  }

}
