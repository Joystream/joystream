import { map, switchMap } from 'rxjs/operators';

import ApiPromise from '@polkadot/api/promise';
import { Balance } from '@polkadot/types/interfaces';
import { GenericAccountId, Option, u128, Vec } from '@polkadot/types';
import { Constructor } from '@polkadot/types/types';
import { Moment } from '@polkadot/types/interfaces/runtime';
import { QueueTxExtrinsicAdd } from '@polkadot/react-components/Status/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import keyringOption from '@polkadot/ui-keyring/options';

import { APIQueryCache, MultipleLinkedMapEntry, SingleLinkedMapEntry, Subscribable, Transport as TransportBase } from '@polkadot/joy-utils/index';

import { ITransport } from './transport';
import { GroupMember } from './elements';

import {
  Curator, CuratorId,
  CuratorApplication, CuratorApplicationId,
  CuratorRoleStakeProfile,
  CuratorOpening, CuratorOpeningId,
  Lead, LeadId
} from '@joystream/types/content-working-group';

import {
  Application as WGApplication,
  Opening as WGOpening,
  Worker, WorkerId,
  RoleStakeProfile
} from '@joystream/types/working-group';

import { Application, Opening, OpeningId, ApplicationId, ActiveApplicationStage } from '@joystream/types/hiring';
import { Stake, StakeId } from '@joystream/types/stake';
import { RewardRelationship, RewardRelationshipId } from '@joystream/types/recurring-rewards';
import { Membership, MemberId, ActorId } from '@joystream/types/members';
import { createAccount, generateSeed } from '@polkadot/joy-utils/accounts';

import { WorkingGroupMembership, GroupLeadStatus } from './tabs/WorkingGroup';
import { WorkingGroupOpening } from './tabs/Opportunities';
import { ActiveRole, OpeningApplication } from './tabs/MyRoles';

import { keyPairDetails } from './flows/apply';

import {
  classifyApplicationCancellation,
  classifyOpeningStage,
  classifyOpeningStakes,
  isApplicationHired
} from './classifiers';
import { WorkingGroups, AvailableGroups, workerRoleNameByGroup } from './working_groups';
import { Sort, Sum, Zero } from './balances';
import _ from 'lodash';

type WorkingGroupPair<HiringModuleType, WorkingGroupType> = {
  hiringModule: HiringModuleType;
  workingGroup: WorkingGroupType;
}

type StakePair<T = Balance> = {
  application: T;
  role: T;
}

type WGApiMethodType =
  'nextOpeningId'
  | 'openingById'
  | 'nextApplicationId'
  | 'applicationById'
  | 'nextWorkerId'
  | 'workerById';
type WGApiTxMethodType =
  'applyOnOpening'
  | 'withdrawApplication'
  | 'leaveRole';
type WGApiMethodsMapping = {
  query: { [key in WGApiMethodType]: string };
  tx: { [key in WGApiTxMethodType]: string };
};

type GroupApplication = CuratorApplication | WGApplication;
type GroupApplicationId = CuratorApplicationId | ApplicationId;
type GroupOpening = CuratorOpening | WGOpening;
type GroupOpeningId = CuratorOpeningId | OpeningId;
type GroupWorker = Worker | Curator;
type GroupWorkerId = CuratorId | WorkerId;
type GroupWorkerStakeProfile = RoleStakeProfile | CuratorRoleStakeProfile;
type GroupLead = Lead | Worker;
type GroupLeadWithMemberId = {
  lead: GroupLead;
  memberId: MemberId;
  workerId?: WorkerId; // Only when it's `working-groups` module lead
}

type WGApiMapping = {
  [key in WorkingGroups]: {
    module: string;
    methods: WGApiMethodsMapping;
    openingType: Constructor<GroupOpening>;
    applicationType: Constructor<GroupApplication>;
    workerType: Constructor<GroupWorker>;
  }
};

const workingGroupsApiMapping: WGApiMapping = {
  [WorkingGroups.StorageProviders]: {
    module: 'storageWorkingGroup',
    methods: {
      query: {
        nextOpeningId: 'nextOpeningId',
        openingById: 'openingById',
        nextApplicationId: 'nextApplicationId',
        applicationById: 'applicationById',
        nextWorkerId: 'nextWorkerId',
        workerById: 'workerById'
      },
      tx: {
        applyOnOpening: 'applyOnOpening',
        withdrawApplication: 'withdrawApplication',
        leaveRole: 'leaveRole'
      }
    },
    openingType: WGOpening,
    applicationType: WGApplication,
    workerType: Worker
  },
  [WorkingGroups.ContentCurators]: {
    module: 'contentWorkingGroup',
    methods: {
      query: {
        nextOpeningId: 'nextCuratorOpeningId',
        openingById: 'curatorOpeningById',
        nextApplicationId: 'nextCuratorApplicationId',
        applicationById: 'curatorApplicationById',
        nextWorkerId: 'nextCuratorId',
        workerById: 'curatorById'
      },
      tx: {
        applyOnOpening: 'applyOnCuratorOpening',
        withdrawApplication: 'withdrawCuratorApplication',
        leaveRole: 'leaveCuratorRole'
      }
    },
    openingType: CuratorOpening,
    applicationType: CuratorApplication,
    workerType: Curator
  }
};

export class Transport extends TransportBase implements ITransport {
  protected api: ApiPromise
  protected cachedApi: APIQueryCache
  protected queueExtrinsic: QueueTxExtrinsicAdd

  constructor (api: ApiPromise, queueExtrinsic: QueueTxExtrinsicAdd) {
    super();
    this.api = api;
    this.cachedApi = new APIQueryCache(api);
    this.queueExtrinsic = queueExtrinsic;
  }

  cachedApiMethodByGroup (group: WorkingGroups, method: WGApiMethodType) {
    const apiModule = workingGroupsApiMapping[group].module;
    const apiMethod = workingGroupsApiMapping[group].methods.query[method];

    return this.cachedApi.query[apiModule][apiMethod];
  }

  apiExtrinsicByGroup (group: WorkingGroups, method: WGApiTxMethodType) {
    const apiModule = workingGroupsApiMapping[group].module;
    const apiMethod = workingGroupsApiMapping[group].methods.tx[method];

    return this.api.tx[apiModule][apiMethod];
  }

  unsubscribe () {
    this.cachedApi.unsubscribe();
  }

  protected async stakeValue (stakeId: StakeId): Promise<Balance> {
    const stake = new SingleLinkedMapEntry<Stake>(
      Stake,
      await this.cachedApi.query.stake.stakes(
        stakeId
      )
    );
    return stake.value.value;
  }

  protected async workerStake (stakeProfile: GroupWorkerStakeProfile): Promise<Balance> {
    return this.stakeValue(stakeProfile.stake_id);
  }

  protected async rewardRelationshipById (id: RewardRelationshipId): Promise<RewardRelationship | undefined> {
    const rewardRelationship = new SingleLinkedMapEntry<RewardRelationship>(
      RewardRelationship,
      await this.cachedApi.query.recurringRewards.rewardRelationships(id)
    ).value;

    return rewardRelationship.isEmpty ? undefined : rewardRelationship;
  }

  protected async workerTotalReward (relationshipId: RewardRelationshipId): Promise<Balance> {
    const relationship = await this.rewardRelationshipById(relationshipId);
    return relationship?.total_reward_received || new u128(0);
  }

  protected async curatorMemberId (curator: Curator): Promise<MemberId> {
    const curatorApplicationId = curator.induction.curator_application_id;
    const curatorApplication = new SingleLinkedMapEntry<CuratorApplication>(
      CuratorApplication,
      await this.cachedApi.query.contentWorkingGroup.curatorApplicationById(curatorApplicationId)
    ).value;

    return curatorApplication.member_id;
  }

  protected async workerRewardRelationship (worker: GroupWorker): Promise<RewardRelationship | undefined> {
    const rewardRelationship = worker.reward_relationship.isSome
      ? await this.rewardRelationshipById(worker.reward_relationship.unwrap())
      : undefined;
    return rewardRelationship;
  }

  protected async groupMember (
    group: WorkingGroups,
    id: GroupWorkerId,
    worker: GroupWorker
  ): Promise<GroupMember> {
    const roleAccount = worker.role_account_id;
    const memberId = group === WorkingGroups.ContentCurators
      ? await this.curatorMemberId(worker as Curator)
      : (worker as Worker).member_id;

    const profile = await this.cachedApi.query.members.membershipById(memberId) as Membership;
    if (profile.handle.isEmpty) {
      throw new Error('No group member profile found!');
    }

    let stakeValue: Balance = new u128(0);
    if (worker.role_stake_profile && worker.role_stake_profile.isSome) {
      stakeValue = await this.workerStake(worker.role_stake_profile.unwrap());
    }

    const rewardRelationship = await this.workerRewardRelationship(worker);

    return ({
      roleAccount,
      group,
      memberId,
      workerId: id.toNumber(),
      profile,
      title: workerRoleNameByGroup[group],
      stake: stakeValue,
      rewardRelationship
    });
  }

  protected async areGroupRolesOpen (group: WorkingGroups, lead = false): Promise<boolean> {
    const nextId = await this.cachedApiMethodByGroup(group, 'nextOpeningId')() as GroupOpeningId;

    // This is chain specfic, but if next id is still 0, it means no openings have been added yet
    if (nextId.eq(0)) {
      return false;
    }

    const groupOpenings = new MultipleLinkedMapEntry<GroupOpeningId, GroupOpening>(
      OpeningId,
      workingGroupsApiMapping[group].openingType,
      await this.cachedApiMethodByGroup(group, 'openingById')()
    );

    for (const groupOpening of groupOpenings.linked_values) {
      const opening = await this.opening(groupOpening.hiring_opening_id.toNumber());
      if (
        opening.is_active &&
        (
          groupOpening instanceof WGOpening
            ? (lead === groupOpening.opening_type.isOfType('Leader'))
            : !lead // Lead opening are never available for content working group currently
        )
      ) {
        return true;
      }
    }

    return false;
  }

  protected async currentCuratorLead (): Promise<GroupLeadWithMemberId | null> {
    const optLeadId = (await this.cachedApi.query.contentWorkingGroup.currentLeadId()) as Option<LeadId>;

    if (!optLeadId.isSome) {
      return null;
    }

    const leadId = optLeadId.unwrap();
    const lead = new SingleLinkedMapEntry<Lead>(
      Lead,
      await this.cachedApi.query.contentWorkingGroup.leadById(leadId)
    );

    const memberId = lead.value.member_id;

    return {
      lead: lead.value,
      memberId
    };
  }

  protected async currentStorageLead (): Promise <GroupLeadWithMemberId | null> {
    const optLeadId = (await this.cachedApi.query.storageWorkingGroup.currentLead()) as Option<WorkerId>;

    if (!optLeadId.isSome) {
      return null;
    }

    const leadWorkerId = optLeadId.unwrap();
    const leadWorkerLink = new SingleLinkedMapEntry(
      Worker,
      await this.cachedApi.query.storageWorkingGroup.workerById(leadWorkerId)
    );
    const leadWorker = leadWorkerLink.value;

    if (!leadWorker.is_active) {
      return null;
    }

    return {
      lead: leadWorker,
      memberId: leadWorker.member_id,
      workerId: leadWorkerId
    };
  }

  async groupLeadStatus (group: WorkingGroups = WorkingGroups.ContentCurators): Promise<GroupLeadStatus> {
    const currentLead = group === WorkingGroups.ContentCurators
      ? await this.currentCuratorLead()
      : await this.currentStorageLead();

    if (currentLead !== null) {
      const profile = await this.cachedApi.query.members.membershipById(currentLead.memberId) as Membership;

      if (profile.handle.isEmpty) {
        throw new Error(`${group} lead profile not found!`);
      }

      const rewardRelationshipId = currentLead.lead.reward_relationship;
      const rewardRelationship = rewardRelationshipId.isSome
        ? await this.rewardRelationshipById(rewardRelationshipId.unwrap())
        : undefined;
      const stake = group === WorkingGroups.StorageProviders && (currentLead.lead as Worker).role_stake_profile.isSome
        ? await this.workerStake((currentLead.lead as Worker).role_stake_profile.unwrap())
        : undefined;

      return {
        lead: {
          memberId: currentLead.memberId,
          workerId: currentLead.workerId,
          roleAccount: currentLead.lead.role_account_id,
          profile,
          title: _.startCase(group) + ' Lead',
          stage: group === WorkingGroups.ContentCurators ? (currentLead.lead as Lead).stage : undefined,
          stake,
          rewardRelationship
        },
        loaded: true
      };
    } else {
      return {
        loaded: true
      };
    }
  }

  async groupOverview (group: WorkingGroups): Promise<WorkingGroupMembership> {
    const workerRolesAvailable = await this.areGroupRolesOpen(group);
    const leadRolesAvailable = await this.areGroupRolesOpen(group, true);
    const leadStatus = await this.groupLeadStatus(group);

    const nextId = await this.cachedApiMethodByGroup(group, 'nextWorkerId')() as GroupWorkerId;

    let workersWithIds: { worker: GroupWorker; id: GroupWorkerId }[] = [];
    // This is chain specfic, but if next id is still 0, it means no workers have been added yet
    if (!nextId.eq(0)) {
      const values = new MultipleLinkedMapEntry<GroupWorkerId, GroupWorker>(
        ActorId,
        workingGroupsApiMapping[group].workerType,
        await this.cachedApiMethodByGroup(group, 'workerById')() as GroupWorker
      );

      workersWithIds = values.linked_values
        // First bind workers with ids
        .map((worker, i) => ({ worker, id: values.linked_keys[i] }))
        // Filter by: active and "not lead"
        .filter(({ worker, id }) => worker.is_active && (!leadStatus.lead?.workerId || !id.eq(leadStatus.lead.workerId)));
    }

    return {
      leadStatus,
      workers: await Promise.all(
        workersWithIds.map(({ worker, id }) => this.groupMember(group, id, worker))
      ),
      workerRolesAvailable,
      leadRolesAvailable
    };
  }

  curationGroup (): Promise<WorkingGroupMembership> {
    return this.groupOverview(WorkingGroups.ContentCurators);
  }

  storageGroup (): Promise<WorkingGroupMembership> {
    return this.groupOverview(WorkingGroups.StorageProviders);
  }

  async opportunitiesByGroup (group: WorkingGroups): Promise<WorkingGroupOpening[]> {
    const output = new Array<WorkingGroupOpening>();
    const nextId = (await this.cachedApiMethodByGroup(group, 'nextOpeningId')()) as GroupOpeningId;

    // This is chain specfic, but if next id is still 0, it means no curator openings have been added yet
    if (!nextId.eq(0)) {
      const highestId = nextId.toNumber() - 1;

      for (let i = highestId; i >= 0; i--) {
        output.push(await this.groupOpening(group, i));
      }
    }

    return output;
  }

  async currentOpportunities (): Promise<WorkingGroupOpening[]> {
    let opportunities: WorkingGroupOpening[] = [];

    for (const group of AvailableGroups) {
      opportunities = opportunities.concat(await this.opportunitiesByGroup(group));
    }

    return opportunities.sort((a, b) => b.stage.starting_block - a.stage.starting_block);
  }

  protected async opening (id: number): Promise<Opening> {
    const opening = new SingleLinkedMapEntry<Opening>(
      Opening,
      await this.cachedApi.query.hiring.openingById(id)
    );

    return opening.value;
  }

  protected async groupOpeningApplications (group: WorkingGroups, groupOpeningId: number): Promise<WorkingGroupPair<Application, GroupApplication>[]> {
    const output = new Array<WorkingGroupPair<Application, GroupApplication>>();

    const nextAppid = (await this.cachedApiMethodByGroup(group, 'nextApplicationId')()) as GroupApplicationId;
    for (let i = 0; i < nextAppid.toNumber(); i++) {
      const cApplication = new SingleLinkedMapEntry<GroupApplication>(
        workingGroupsApiMapping[group].applicationType,
        await this.cachedApiMethodByGroup(group, 'applicationById')(i)
      );

      if (cApplication.value.opening_id.toNumber() !== groupOpeningId) {
        continue;
      }

      const appId = cApplication.value.application_id;
      const baseApplications = new SingleLinkedMapEntry<Application>(
        Application,
        await this.cachedApi.query.hiring.applicationById(
          appId
        )
      );

      output.push({
        hiringModule: baseApplications.value,
        workingGroup: cApplication.value
      });
    }

    return output;
  }

  async groupOpening (group: WorkingGroups, id: number): Promise<WorkingGroupOpening> {
    const nextId = (await this.cachedApiMethodByGroup(group, 'nextOpeningId')() as GroupOpeningId).toNumber();
    if (id < 0 || id >= nextId) {
      throw new Error('invalid id');
    }

    const groupOpening = new SingleLinkedMapEntry<GroupOpening>(
      workingGroupsApiMapping[group].openingType,
      await this.cachedApiMethodByGroup(group, 'openingById')(id)
    ).value;

    const opening = await this.opening(
      groupOpening.hiring_opening_id.toNumber()
    );

    const applications = await this.groupOpeningApplications(group, id);
    const stakes = classifyOpeningStakes(opening);

    return ({
      opening: opening,
      meta: {
        id: id.toString(),
        group,
        type: groupOpening instanceof WGOpening ? groupOpening.opening_type : undefined
      },
      stage: await classifyOpeningStage(this, opening),
      applications: {
        numberOfApplications: applications.length,
        maxNumberOfApplications: opening.max_applicants,
        requiredApplicationStake: stakes.application,
        requiredRoleStake: stakes.role,
        defactoMinimumStake: new u128(0)
      },
      defactoMinimumStake: new u128(0)
    });
  }

  protected async openingApplicationTotalStake (application: Application): Promise<Balance> {
    const promises = new Array<Promise<Balance>>();

    if (application.active_application_staking_id.isSome) {
      promises.push(this.stakeValue(application.active_application_staking_id.unwrap()));
    }

    if (application.active_role_staking_id.isSome) {
      promises.push(this.stakeValue(application.active_role_staking_id.unwrap()));
    }

    return Sum(await Promise.all(promises));
  }

  async openingApplicationRanks (group: WorkingGroups, openingId: number): Promise<Balance[]> {
    const applications = await this.groupOpeningApplications(group, openingId);
    return Sort(
      (await Promise.all(
        applications
          .filter(a => a.hiringModule.stage.value instanceof ActiveApplicationStage)
          .map(application => this.openingApplicationTotalStake(application.hiringModule))
      ))
    );
  }

  expectedBlockTime (): Promise<number> {
    return this.promise<number>(
      (this.api.consts.babe.expectedBlockTime as Moment).toNumber() / 1000
    );
  }

  async blockHash (height: number): Promise<string> {
    const blockHash = await this.cachedApi.query.system.blockHash(height);
    return blockHash.toString();
  }

  async blockTimestamp (height: number): Promise<Date> {
    const blockTime = await this.api.query.timestamp.now.at(
      await this.blockHash(height)
    ) as Moment;

    return new Date(blockTime.toNumber());
  }

  transactionFee (): Promise<Balance> {
    return this.promise<Balance>(new u128(5));
  }

  accounts (): Subscribable<keyPairDetails[]> {
    return keyringOption.optionsSubject.pipe(
      map(accounts => {
        return accounts.all
          .filter(x => x.value)
          .map(async (result, k) => {
            return {
              shortName: result.name,
              accountId: new GenericAccountId(result.value as string),
              balance: await this.cachedApi.query.balances.freeBalance(result.value as string)
            };
          });
      }),
      switchMap(async x => Promise.all(x))
    ) as Subscribable<keyPairDetails[]>;
  }

  protected async applicationStakes (app: Application): Promise<StakePair<Balance>> {
    const stakes = {
      application: Zero,
      role: Zero
    };

    const appStake = app.active_application_staking_id;
    if (appStake.isSome) {
      stakes.application = await this.stakeValue(appStake.unwrap());
    }

    const roleStake = app.active_role_staking_id;
    if (roleStake.isSome) {
      stakes.role = await this.stakeValue(roleStake.unwrap());
    }

    return stakes;
  }

  protected async myApplicationRank (myApp: Application, applications: Array<Application>): Promise<number> {
    const activeApplications = applications.filter(app => app.stage.value instanceof ActiveApplicationStage);
    const stakes = await Promise.all(
      activeApplications.map(app => this.openingApplicationTotalStake(app))
    );

    const appvalues = activeApplications.map((app, key) => {
      return {
        app: app,
        value: stakes[key]
      };
    });

    appvalues.sort((a, b): number => {
      if (a.value.eq(b.value)) {
        return 0;
      } else if (a.value.gt(b.value)) {
        return -1;
      }

      return 1;
    });

    return appvalues.findIndex(v => v.app.eq(myApp)) + 1;
  }

  async openingApplicationsByAddressAndGroup (group: WorkingGroups, roleKey: string): Promise<OpeningApplication[]> {
    const applications = new MultipleLinkedMapEntry<GroupApplicationId, GroupApplication>(
      ApplicationId,
      workingGroupsApiMapping[group].applicationType,
      await this.cachedApiMethodByGroup(group, 'applicationById')()
    );

    const myApps = applications.linked_values.filter(app => app.role_account_id.eq(roleKey));
    const myAppIds = applications.linked_keys.filter((id, key) => applications.linked_values[key].role_account_id.eq(roleKey));

    const hiringAppPairs = await Promise.all(
      myApps.map(
        async app => new SingleLinkedMapEntry<Application>(
          Application,
          await this.cachedApi.query.hiring.applicationById(
            app.application_id
          )
        )
      )
    );

    const hiringApps = hiringAppPairs.map(app => app.value);

    const stakes = await Promise.all(
      hiringApps.map(app => this.applicationStakes(app))
    );

    const openings = await Promise.all(
      myApps.map(application => {
        return this.groupOpening(group, application.opening_id.toNumber());
      })
    );

    const allAppsByOpening = (await Promise.all(
      myApps.map(application => {
        return this.groupOpeningApplications(group, application.opening_id.toNumber());
      })
    ));

    return await Promise.all(
      openings.map(async (o, key) => {
        return {
          id: myAppIds[key].toNumber(),
          hired: isApplicationHired(hiringApps[key]),
          cancelledReason: classifyApplicationCancellation(hiringApps[key]),
          rank: await this.myApplicationRank(hiringApps[key], allAppsByOpening[key].map(a => a.hiringModule)),
          capacity: o.applications.maxNumberOfApplications,
          stage: o.stage,
          opening: o.opening,
          meta: o.meta,
          applicationStake: stakes[key].application,
          roleStake: stakes[key].role,
          review_end_time: o.stage.review_end_time,
          review_end_block: o.stage.review_end_block
        };
      })
    );
  }

  // Get opening applications for all groups by address
  async openingApplicationsByAddress (roleKey: string): Promise<OpeningApplication[]> {
    let applications: OpeningApplication[] = [];
    for (const group of AvailableGroups) {
      applications = applications.concat(await this.openingApplicationsByAddressAndGroup(group, roleKey));
    }

    return applications;
  }

  async myRolesByGroup (group: WorkingGroups, roleKeyId: string): Promise<ActiveRole[]> {
    const workers = new MultipleLinkedMapEntry<GroupWorkerId, GroupWorker>(
      ActorId,
      workingGroupsApiMapping[group].workerType,
      await this.cachedApiMethodByGroup(group, 'workerById')()
    );

    const groupLead = (await this.groupLeadStatus(group)).lead;

    return Promise.all(
      workers
        .linked_values
        .toArray()
        // We need to associate worker ids with workers BEFORE filtering the array
        .map((worker, index) => ({ worker, id: workers.linked_keys[index] }))
        .filter(({ worker }) => worker.role_account_id.eq(roleKeyId) && worker.is_active)
        .map(async workerWithId => {
          const { worker, id } = workerWithId;

          let stakeValue: Balance = new u128(0);
          if (worker.role_stake_profile && worker.role_stake_profile.isSome) {
            stakeValue = await this.workerStake(worker.role_stake_profile.unwrap());
          }

          let earnedValue: Balance = new u128(0);
          if (worker.reward_relationship && worker.reward_relationship.isSome) {
            earnedValue = await this.workerTotalReward(worker.reward_relationship.unwrap());
          }

          return {
            workerId: id,
            name: (groupLead?.workerId && groupLead.workerId.eq(id))
              ? _.startCase(group) + ' Lead'
              : workerRoleNameByGroup[group],
            reward: earnedValue,
            stake: stakeValue,
            group
          };
        })
    );
  }

  // All groups roles by key
  async myRoles (roleKey: string): Promise<ActiveRole[]> {
    let roles: ActiveRole[] = [];
    for (const group of AvailableGroups) {
      roles = roles.concat(await this.myRolesByGroup(group, roleKey));
    }

    return roles;
  }

  protected generateRoleAccount (name: string, password = ''): string | null {
    const { address, deriveError, derivePath, isSeedValid, pairType, seed } = generateSeed(null, '', 'bip');

    const isValid = !!address && !deriveError && isSeedValid;
    if (!isValid) {
      return null;
    }

    const status = createAccount(`${seed}${derivePath}`, pairType, name, password, 'created account');
    return status.account as string;
  }

  applyToOpening (
    group: WorkingGroups,
    id: number,
    roleAccountName: string,
    sourceAccount: string,
    appStake: Balance,
    roleStake: Balance,
    applicationText: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      (this.cachedApi.query.members.memberIdsByControllerAccountId(sourceAccount) as Promise<Vec<MemberId>>)
        .then(membershipIds => {
          if (membershipIds.length === 0) {
            reject(new Error('No membship ID associated with this address'));
          }

          const roleAccount = this.generateRoleAccount(roleAccountName);
          if (!roleAccount) {
            reject(new Error('failed to create role account'));
          }
          const tx = this.apiExtrinsicByGroup(group, 'applyOnOpening')(
            membershipIds[0], // Member id
            id, // Worker/Curator opening id
            roleAccount, // Role account
            // TODO: Will need to be adjusted if AtLeast Zero stakes become possible
            roleStake.eq(Zero) ? null : roleStake, // Role stake
            appStake.eq(Zero) ? null : appStake, // Application stake
            applicationText // Human readable text
          ) as unknown as SubmittableExtrinsic;

          const txFailedCb = () => {
            reject(new Error('transaction failed'));
          };

          const txSuccessCb = () => {
            resolve(1);
          };

          this.queueExtrinsic({
            accountId: sourceAccount,
            extrinsic: tx,
            txFailedCb,
            txSuccessCb
          });
        });
    });
  }

  leaveRole (group: WorkingGroups, sourceAccount: string, id: number, rationale: string) {
    const tx = this.apiExtrinsicByGroup(group, 'leaveRole')(
      id,
      rationale
    ) as unknown as SubmittableExtrinsic;

    this.queueExtrinsic({
      accountId: sourceAccount,
      extrinsic: tx
    });
  }

  withdrawApplication (group: WorkingGroups, sourceAccount: string, id: number) {
    const tx = this.apiExtrinsicByGroup(group, 'withdrawApplication')(
      id
    ) as unknown as SubmittableExtrinsic;

    this.queueExtrinsic({
      accountId: sourceAccount,
      extrinsic: tx
    });
  }
}
