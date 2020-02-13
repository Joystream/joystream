import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import ApiPromise from '@polkadot/api/promise';
import { Balance } from '@polkadot/types/interfaces'
import { GenericAccountId, Option, u32, u64, u128, Vec } from '@polkadot/types'
import { Moment } from '@polkadot/types/interfaces/runtime';
import { QueueTxExtrinsicAdd } from '@polkadot/react-components/Status/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import keyringOption from '@polkadot/ui-keyring/options';

import { MultipleLinkedMapEntry, SingleLinkedMapEntry } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { GroupMember } from './elements'
import { Subscribable, Transport as TransportBase } from '@polkadot/joy-utils/index'

import { Actor, Role } from '@joystream/types/roles';
import { Curator, CuratorId, CuratorApplication, CuratorInduction, CuratorRoleStakeProfile, CuratorOpening, CuratorOpeningId, Lead, LeadId } from '@joystream/types/content-working-group';
import { Application, Opening, OpeningId } from '@joystream/types/hiring';
import { Stake, StakeId } from '@joystream/types/stake';
import { Recipient, RewardRelationship, RewardRelationshipId } from '@joystream/types/recurring-rewards';
import { Profile, MemberId } from '@joystream/types/members';

// FIXME: Move these functions to a dedicayed utils package
import { createAccount, generateSeed } from '@polkadot/joy-utils/accounts'

import { WorkingGroupMembership, StorageAndDistributionMembership } from "./tabs/WorkingGroup"
import { WorkingGroupOpening } from "./tabs/Opportunities"
import { ActiveRole, OpeningApplication } from "./tabs/MyRoles"

import { keyPairDetails } from './flows/apply'

import { classifyOpeningStage, classifyOpeningStakes } from "./classifiers"
import { WorkingGroups } from "./working_groups"
import { Sort, Sum } from './balances'

type WorkingGroupPair<HiringModuleType, WorkingGroupType> = {
  hiringModule: HiringModuleType,
  workingGroup: WorkingGroupType,
}

interface IRoleAccounter {
  role_account: GenericAccountId
  induction?: CuratorInduction
  role_stake_profile?: Option<CuratorRoleStakeProfile>
  reward_relationship: Option<RewardRelationshipId>
}

export class Transport extends TransportBase implements ITransport {
  protected api: ApiPromise
  protected queueExtrinsic: QueueTxExtrinsicAdd

  constructor(api: ApiPromise, queueExtrinsic: QueueTxExtrinsicAdd) {
    super()
    this.api = api
    this.queueExtrinsic = queueExtrinsic
  }

  async roles(): Promise<Array<Role>> {
    const roles: any = await this.api.query.actors.availableRoles()
    return this.promise<Array<Role>>(roles.map((role: Role) => role))
  }

  protected async groupMember(curator: IRoleAccounter, lead: boolean = false): Promise<GroupMember> {
    return new Promise<GroupMember>(async (resolve, reject) => {
      const account = curator.role_account

      const memberIds = await this.api.query.members.memberIdsByRootAccountId(account) as Vec<MemberId>
      if (memberIds.length == 0) {
        reject("no member account found")
      }

      const memberId = memberIds[0]
      if (!memberId) {
        reject("no member id")
      }

      const profile = await this.api.query.members.memberProfile(memberId) as Option<Profile>
      if (profile.isNone) {
        reject("no profile found")
      }

      const actor = new Actor({
        member_id: memberId,
        account: account,
      })

      let stakeValue: Balance = new u128(0)
      if (curator.role_stake_profile && curator.role_stake_profile.isSome) {
        const stakeProfile = curator.role_stake_profile.unwrap()
        const stake = new SingleLinkedMapEntry<Stake>(
          Stake,
          await this.api.query.stake.stakes(
            stakeProfile.stake_id,
          ),
        )
        stakeValue = stake.value.value
      }

      let earnedValue: Balance = new u128(0)
      if (curator.reward_relationship && curator.reward_relationship.isSome) {
        const relationshipId = curator.reward_relationship.unwrap()
        const relationship = new SingleLinkedMapEntry<RewardRelationship>(
          RewardRelationship,
          await this.api.query.recurringRewards.rewardRelationships(
            relationshipId,
          ),
        )
        const recipient = new SingleLinkedMapEntry<Recipient>(
          Recipient,
          await this.api.query.recurringRewards.rewardRelationships(
            relationship.value.recipient,
          ),
        )
        earnedValue = recipient.value.total_reward_received
      }

      resolve({
        actor: actor,
        profile: profile.unwrap() as Profile,
        title: lead ? 'Group lead' : 'Content curator',
        lead: lead,
        stake: stakeValue,
        earned: earnedValue,
      })
    })
  }

  protected async areAnyCuratorRolesOpen(): Promise<boolean> {

    const curatorOpenings = new MultipleLinkedMapEntry<CuratorOpeningId, CuratorOpening>(
      CuratorOpeningId,
      CuratorOpening,
      await this.api.query.contentWorkingGroup.curatorOpeningById(),
    )

    for (let i = 0; i < curatorOpenings.linked_values.length; i++) {
      const opening = await this.opening(curatorOpenings.linked_values[i].opening_id.toNumber())
      if (opening.is_active) {
        return true
      }
    }

    return false
  }

  async curationGroup(): Promise<WorkingGroupMembership> {
    const values = new MultipleLinkedMapEntry<CuratorId, Curator>(
      CuratorId,
      Curator,
      await this.api.query.contentWorkingGroup.curatorById(),
    )

    const members = values.linked_values.toArray().reverse()

    // If there's a lead ID, then make sure they're promoted to the top
    const leadId = (await this.api.query.contentWorkingGroup.currentLeadId()) as Option<LeadId>
    if (leadId.isSome) {
      const lead = new SingleLinkedMapEntry<Lead>(
        Lead,
        await this.api.query.contentWorkingGroup.leadById(
          leadId.unwrap(),
        ),
      )
      const id = members.findIndex(
        member => member.role_account.eq(lead.value.role_account)
      )
      members.unshift(...members.splice(id, 1))
    }

    return {
      members: await Promise.all(
        members
          .filter(value => value.is_active)
          .map((result, k) => this.groupMember(result, k === 0))
      ),
      rolesAvailable: await this.areAnyCuratorRolesOpen(),
    }
  }

  storageGroup(): Promise<StorageAndDistributionMembership> {
    return this.promise<StorageAndDistributionMembership>(
      {} as StorageAndDistributionMembership,
    )
  }

  currentOpportunities(): Promise<Array<WorkingGroupOpening>> {
    return new Promise<Array<WorkingGroupOpening>>(async (resolve, reject) => {
      const output = new Array<WorkingGroupOpening>()
      const highestId = (await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as u32).toNumber() - 1
      if (highestId < 0) {
        resolve([])
      }

      for (let i = highestId; i >= 0; i--) {
        output.push(await this.curationGroupOpening(i))
      }

      resolve(output)
    })
  }

  protected async opening(id: number): Promise<Opening> {
    return new Promise<Opening>(async (resolve, reject) => {
      const opening = new SingleLinkedMapEntry<Opening>(
        Opening,
        await this.api.query.hiring.openingById(id),
      )
      resolve(opening.value)
    })
  }

  protected async curatorOpeningApplications(curatorOpeningId: number): Promise<Array<WorkingGroupPair<Application, CuratorApplication>>> {
    const output = new Array<WorkingGroupPair<Application, CuratorApplication>>()

    const nextAppid = await this.api.query.contentWorkingGroup.nextCuratorApplicationId() as u64
    for (let i = 0; i < nextAppid.toNumber(); i++) {
      const cApplication = new SingleLinkedMapEntry<CuratorApplication>(
        CuratorApplication,
        await this.api.query.contentWorkingGroup.curatorApplicationById(i),
      )

      if (cApplication.value.curator_opening_id.toNumber() !== curatorOpeningId) {
        continue
      }

      const appId = cApplication.value.application_id
      const baseApplications = new SingleLinkedMapEntry<Application>(
        Application,
        await this.api.query.hiring.applicationById(
          appId,
        )
      )

      output.push({
        hiringModule: baseApplications.value,
        workingGroup: cApplication.value,
      })
    }

    return output
  }

  async curationGroupOpening(id: number): Promise<WorkingGroupOpening> {
    return new Promise<WorkingGroupOpening>(async (resolve, reject) => {
      const nextId = (await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as u32).toNumber()
      if (id < 0 || id >= nextId) {
        reject("invalid id")
      }

      const curatorOpening = new SingleLinkedMapEntry<CuratorOpening>(
        CuratorOpening,
        await this.api.query.contentWorkingGroup.curatorOpeningById(id),
      )

      const opening = await this.opening(
        curatorOpening.value.getField<OpeningId>("opening_id").toNumber()
      )

      const currentLeadId = await this.api.query.contentWorkingGroup.currentLeadId() as Option<LeadId>

      if (currentLeadId.isNone) {
        reject("no current lead id")
      }

      const lead = new SingleLinkedMapEntry<Lead>(
        Lead,
        await this.api.query.contentWorkingGroup.leadById(
          currentLeadId.unwrap(),
        ),
      )

      const applications = await this.curatorOpeningApplications(id)
      const stakes = classifyOpeningStakes(opening)

      resolve({
        creator: await this.groupMember(lead.value, true),
        opening: opening,
        meta: {
          id: id.toString(),
          group: WorkingGroups.ContentCurators,
        },
        stage: await classifyOpeningStage(this, opening),
        applications: {
          numberOfApplications: applications.length,
          maxNumberOfApplications: opening.max_applicants,
          requiredApplicationStake: stakes.application,
          requiredRoleStake: stakes.role,
          defactoMinimumStake: new u128(0),
        },
        defactoMinimumStake: new u128(0)
      })
    })
  }

  protected async stakeValue(id: StakeId): Promise<Balance> {
    const stake = new SingleLinkedMapEntry<Stake>(
      Stake,
      await this.api.query.stake.stakes(id),
    )
    return stake.value.value
  }

  protected async openingApplicationTotalStake(application: Application): Promise<Balance> {
    const promises = new Array<Promise<Balance>>()

    if (application.active_application_staking_id.isSome) {
      promises.push(this.stakeValue(application.active_application_staking_id.unwrap()))
    }

    if (application.active_role_staking_id.isSome) {
      promises.push(this.stakeValue(application.active_role_staking_id.unwrap()))
    }

    return Sum(await Promise.all(promises))
  }

  async openingApplicationRanks(openingId: number): Promise<Balance[]> {
    const applications = await this.curatorOpeningApplications(openingId)
    return Sort(
      await Promise.all(
        applications.map(application => this.openingApplicationTotalStake(application.hiringModule))
      )
    )
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
    return keyringOption.optionsSubject.pipe(
      map(accounts => {
        return accounts.all
          .filter(x => x.value)
          .map(async (result, k) => {
            return {
              shortName: result.name,
              accountId: new GenericAccountId(result.value as string),
              balance: await this.api.query.balances.freeBalance(result.value as string),
            }
          })
      }),
      switchMap(async x => Promise.all(x)),
    ) as Subscribable<keyPairDetails[]>
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

  protected generateRoleAccount(name: string, password: string = ''): string | null {
    const { address, deriveError, derivePath, isSeedValid, pairType, seed } = generateSeed(null, '', 'bip')

    const isValid = !!address && !deriveError && isSeedValid;
    if (!isValid) {
      return null
    }

    const status = createAccount(`${seed}${derivePath}`, pairType, name, password, 'created account');
    return status.account as string
  }

  async applyToCuratorOpening(
    id: number,
    roleAccountName: string,
    sourceAccount: string,
    appStake: Balance,
    roleStake: Balance,
    applicationText: string): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      const membershipIds = (
        await this.api.query.members.memberIdsByControllerAccountId(sourceAccount)
      ) as Vec<MemberId>
      if (membershipIds.length == 0) {
        reject("No membship ID associated with this address")
      }

      const roleAccount = this.generateRoleAccount(roleAccountName)
      if (!roleAccount) {
        reject('failed to create role account')
      }

      const tx = this.api.tx.contentWorkingGroup.applyOnCuratorOpening(
        membershipIds[0],
        new u32(id),
        new GenericAccountId(roleAccount as string),
        roleStake,
        appStake,
        new Text(applicationText),
      ) as unknown as SubmittableExtrinsic

      const txFailedCb = () => {
        reject("transaction failed")
      }

      const txSuccessCb = () => {
        console.log("success")
        resolve(1)
      }

      this.queueExtrinsic({
        accountId: sourceAccount,
        extrinsic: tx,
        txFailedCb,
        txSuccessCb,
      });
    }
    )
  }
}
