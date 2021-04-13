import { map, switchMap } from 'rxjs/operators';

import ApiPromise from '@polkadot/api/promise';
import { Balance } from '@polkadot/types/interfaces';
import { Option, Vec } from '@polkadot/types';
import { Moment } from '@polkadot/types/interfaces/runtime';
import { QueueTxExtrinsicAdd } from '@polkadot/react-components/Status/types';
import keyringOption from '@polkadot/ui-keyring/options';

import { APIQueryCache } from '@polkadot/joy-utils/transport/APIQueryCache';
import { Subscribable } from '@polkadot/joy-utils/react/helpers';
import BaseTransport from '@polkadot/joy-utils/transport/base';

import { ITransport } from './transport';
import { GroupMember } from './elements';

import { Application as WGApplication,
  Opening as WGOpening,
  Worker, WorkerId,
  RoleStakeProfile } from '@joystream/types/working-group';

import { Application, Opening, OpeningId, ApplicationId, ActiveApplicationStage } from '@joystream/types/hiring';
import { Stake, StakeId } from '@joystream/types/stake';
import { RewardRelationship, RewardRelationshipId } from '@joystream/types/recurring-rewards';
import { Membership, MemberId } from '@joystream/types/members';
import { createAccount, generateSeed } from '@polkadot/joy-utils/functions/accounts';

import { WorkingGroupMembership, GroupLeadStatus } from './tabs/WorkingGroup';
import { WorkingGroupOpening } from './tabs/Opportunities';
import { ActiveRole, OpeningApplication } from './tabs/MyRoles';

import { keyPairDetails } from './flows/apply';

import { classifyApplicationCancellation,
  classifyOpeningStage,
  classifyOpeningStakes,
  isApplicationHired } from './classifiers';
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

type GroupLeadWithMemberId = {
  lead: Worker;
  memberId: MemberId;
  workerId: WorkerId;
}

const apiModuleByGroup = {
  [WorkingGroups.StorageProviders]: 'storageWorkingGroup',
  [WorkingGroups.ContentCurators]: 'contentDirectoryWorkingGroup',
  [WorkingGroups.Operations]: 'operationsWorkingGroup'
} as const;

export class Transport extends BaseTransport implements ITransport {
  protected queueExtrinsic: QueueTxExtrinsicAdd

  constructor (api: ApiPromise, queueExtrinsic: QueueTxExtrinsicAdd) {
    super(api, new APIQueryCache(api));
    this.queueExtrinsic = queueExtrinsic;
  }

  queryByGroup (group: WorkingGroups) {
    const apiModule = apiModuleByGroup[group];

    return this.api.query[apiModule];
  }

  queryCachedByGroup (group: WorkingGroups) {
    const apiModule = apiModuleByGroup[group];

    return this.cacheApi.query[apiModule];
  }

  txByGroup (group: WorkingGroups) {
    const apiModule = apiModuleByGroup[group];

    return this.api.tx[apiModule];
  }

  unsubscribe () {
    this.cacheApi.unsubscribe();
  }

  protected async stakeValue (stakeId: StakeId): Promise<Balance> {
    const stake = await this.cacheApi.query.stake.stakes(stakeId) as Stake;

    return stake.value;
  }

  protected async workerStake (stakeProfile: RoleStakeProfile): Promise<Balance> {
    return this.stakeValue(stakeProfile.stake_id);
  }

  protected async rewardRelationshipById (id: RewardRelationshipId): Promise<RewardRelationship | undefined> {
    const rewardRelationship = await this.cacheApi.query.recurringRewards.rewardRelationships(id) as RewardRelationship;

    return rewardRelationship.isEmpty ? undefined : rewardRelationship;
  }

  protected async workerTotalReward (relationshipId: RewardRelationshipId): Promise<Balance> {
    const relationship = await this.rewardRelationshipById(relationshipId);

    return relationship?.total_reward_received || this.api.createType('Balance', 0);
  }

  protected async workerRewardRelationship (worker: Worker): Promise<RewardRelationship | undefined> {
    const rewardRelationship = worker.reward_relationship.isSome
      ? await this.rewardRelationshipById(worker.reward_relationship.unwrap())
      : undefined;

    return rewardRelationship;
  }

  protected async groupMember (
    group: WorkingGroups,
    id: WorkerId,
    worker: Worker
  ): Promise<GroupMember> {
    const roleAccount = worker.role_account_id;
    const memberId = worker.member_id;

    const profile = await this.cacheApi.query.members.membershipById(memberId) as Membership;

    if (profile.handle.isEmpty) {
      throw new Error('No group member profile found!');
    }

    let stakeValue: Balance = this.api.createType('Balance', 0);

    if (worker.role_stake_profile && worker.role_stake_profile.isSome) {
      stakeValue = await this.workerStake(worker.role_stake_profile.unwrap());
    }

    const rewardRelationship = await this.workerRewardRelationship(worker);

    const storage = await this.queryCachedByGroup(group).workerStorage(id)

    return ({
      roleAccount,
      group,
      memberId,
      workerId: id.toNumber(),
      profile,
      title: workerRoleNameByGroup[group],
      stake: stakeValue,
      rewardRelationship,
      storage: this.api.createType('Text', storage).toString()
    });
  }

  protected async areGroupRolesOpen (group: WorkingGroups, lead = false): Promise<boolean> {
    const groupOpenings = await this.entriesByIds<OpeningId, WGOpening>(
      this.queryByGroup(group).openingById
    );

    for (const [/* id */, groupOpening] of groupOpenings) {
      const opening = await this.opening(groupOpening.hiring_opening_id.toNumber());

      if (
        opening.is_active &&
        (
          groupOpening instanceof WGOpening
            ? (lead === groupOpening.opening_type.isOfType('Leader'))
            : !lead // Lead openings are never available for content working group currently
        )
      ) {
        return true;
      }
    }

    return false;
  }

  protected async groupLead (group: WorkingGroups): Promise <GroupLeadWithMemberId | null> {
    const optLeadId = (await this.queryCachedByGroup(group).currentLead()) as Option<WorkerId>;

    if (!optLeadId.isSome) {
      return null;
    }

    const leadWorkerId = optLeadId.unwrap();
    const leadWorker = await this.queryCachedByGroup(group).workerById(leadWorkerId) as Worker;

    if (leadWorker.isEmpty) {
      return null;
    }

    return {
      lead: leadWorker,
      memberId: leadWorker.member_id,
      workerId: leadWorkerId
    };
  }

  async groupLeadStatus (group: WorkingGroups = WorkingGroups.ContentCurators): Promise<GroupLeadStatus> {
    const currentLead = await this.groupLead(group);

    if (currentLead !== null) {
      const profile = await this.cacheApi.query.members.membershipById(currentLead.memberId) as Membership;

      if (profile.handle.isEmpty) {
        throw new Error(`${group} lead profile not found!`);
      }

      const rewardRelationshipId = currentLead.lead.reward_relationship;
      const rewardRelationship = rewardRelationshipId.isSome
        ? await this.rewardRelationshipById(rewardRelationshipId.unwrap())
        : undefined;
      const stake = currentLead.lead.role_stake_profile.isSome
        ? await this.workerStake(currentLead.lead.role_stake_profile.unwrap())
        : undefined;

      return {
        lead: {
          memberId: currentLead.memberId,
          workerId: currentLead.workerId,
          roleAccount: currentLead.lead.role_account_id,
          profile,
          title: _.startCase(group) + ' Lead',
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

    const workers = (await this.entriesByIds<WorkerId, Worker>(
      this.queryByGroup(group).workerById
    ))
      .filter(([id, worker]) => worker.is_active && (!leadStatus.lead?.workerId || !id.eq(leadStatus.lead.workerId)));

    return {
      leadStatus,
      workers: await Promise.all(workers.map(([id, worker]) => this.groupMember(group, id, worker))),
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
    const nextId = (await this.queryCachedByGroup(group).nextOpeningId()) as OpeningId;

    // This is chain specfic, but if next id is still 0, it means no openings have been added yet
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
    const opening = await this.cacheApi.query.hiring.openingById(id) as Opening;

    return opening;
  }

  protected async groupOpeningApplications (group: WorkingGroups, groupOpeningId: number): Promise<WorkingGroupPair<Application, WGApplication>[]> {
    const groupApplications = await this.entriesByIds<ApplicationId, WGApplication>(
      this.queryByGroup(group).applicationById
    );

    const openingGroupApplications = groupApplications
      .filter(([id, groupApplication]) => groupApplication.opening_id.toNumber() === groupOpeningId);

    const openingHiringApplications = (await Promise.all(
      openingGroupApplications.map(
        ([id, groupApplication]) => this.cacheApi.query.hiring.applicationById(groupApplication.application_id)
      )
    )) as Application[];

    return openingHiringApplications.map((hiringApplication, index) => ({
      hiringModule: hiringApplication,
      workingGroup: openingGroupApplications[index][1]
    }));
  }

  async groupOpening (group: WorkingGroups, id: number): Promise<WorkingGroupOpening> {
    const nextId = (await this.queryCachedByGroup(group).nextOpeningId() as OpeningId).toNumber();

    if (id < 0 || id >= nextId) {
      throw new Error('invalid id');
    }

    const groupOpening = await this.queryCachedByGroup(group).openingById(id) as WGOpening;

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
        defactoMinimumStake: this.api.createType('Balance', 0)
      },
      defactoMinimumStake: this.api.createType('Balance', 0)
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
          .filter((a) => a.hiringModule.stage.value instanceof ActiveApplicationStage)
          .map((application) => this.openingApplicationTotalStake(application.hiringModule))
      ))
    );
  }

  expectedBlockTime (): number {
    return (this.api.consts.babe.expectedBlockTime as Moment).toNumber() / 1000;
  }

  async blockHash (height: number): Promise<string> {
    const blockHash = await this.api.rpc.chain.getBlockHash(height);

    return blockHash.toString();
  }

  async blockTimestamp (height: number): Promise<Date> {
    const blockTime = await this.api.query.timestamp.now.at(
      await this.blockHash(height)
    );

    return new Date(blockTime.toNumber());
  }

  accounts (): Subscribable<keyPairDetails[]> {
    return keyringOption.optionsSubject.pipe(
      map((accounts) => {
        return accounts.all
          .filter((x) => x.value)
          .map(async (result, k) => {
            return {
              shortName: result.name,
              accountId: this.api.createType('AccountId', result.value),
              balance: (await this.api.derive.balances.account(result.value as string)).freeBalance
            };
          });
      }),
      switchMap(async (x) => Promise.all(x))
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
    const activeApplications = applications.filter((app) => app.stage.value instanceof ActiveApplicationStage);
    const stakes = await Promise.all(
      activeApplications.map((app) => this.openingApplicationTotalStake(app))
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

    return appvalues.findIndex((v) => v.app.eq(myApp)) + 1;
  }

  async openingApplicationsByAddressAndGroup (group: WorkingGroups, roleKey: string): Promise<OpeningApplication[]> {
    const myGroupApplications = (await this.entriesByIds<ApplicationId, WGApplication>(
      this.queryByGroup(group).applicationById
    ))
      .filter(([id, groupApplication]) => groupApplication.role_account_id.eq(roleKey));

    const myHiringApplications = await Promise.all(
      myGroupApplications.map(
        ([id, groupApplication]) => this.cacheApi.query.hiring.applicationById(groupApplication.application_id)
      )
    ) as Application[];

    const stakes = await Promise.all(
      myHiringApplications.map((app) => this.applicationStakes(app))
    );

    const openings = await Promise.all(
      myGroupApplications.map(([id, groupApplication]) => {
        return this.groupOpening(group, groupApplication.opening_id.toNumber());
      })
    );

    const allAppsByOpening = (await Promise.all(
      myGroupApplications.map(([id, groupApplication]) => (
        this.groupOpeningApplications(group, groupApplication.opening_id.toNumber())
      ))
    ));

    return await Promise.all(
      openings.map(async (o, key) => {
        return {
          id: myGroupApplications[key][0].toNumber(),
          hired: isApplicationHired(myHiringApplications[key]),
          cancelledReason: classifyApplicationCancellation(myHiringApplications[key]),
          rank: await this.myApplicationRank(myHiringApplications[key], allAppsByOpening[key].map((a) => a.hiringModule)),
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
    const workers = await this.entriesByIds<WorkerId, Worker>(
      this.queryByGroup(group).workerById
    );

    const groupLead = (await this.groupLeadStatus(group)).lead;

    return Promise.all(
      workers
        .filter(([id, worker]) => worker.role_account_id.eq(roleKeyId) && worker.is_active)
        .map(async ([id, worker]) => {
          let stakeValue: Balance = this.api.createType('Balance', 0);

          if (worker.role_stake_profile && worker.role_stake_profile.isSome) {
            stakeValue = await this.workerStake(worker.role_stake_profile.unwrap());
          }

          let earnedValue: Balance = this.api.createType('Balance', 0);

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
      (this.cacheApi.query.members.memberIdsByControllerAccountId(sourceAccount) as Promise<Vec<MemberId>>)
        .then((membershipIds) => {
          if (membershipIds.length === 0) {
            reject(new Error('No membship ID associated with this address'));
          }

          const roleAccount = this.generateRoleAccount(roleAccountName);

          if (!roleAccount) {
            reject(new Error('failed to create role account'));
          }

          const tx = this.txByGroup(group).applyOnOpening(
            membershipIds[0], // Member id
            id, // Worker opening id
            roleAccount, // Role account
            // TODO: Will need to be adjusted if AtLeast Zero stakes become possible
            roleStake.eq(Zero) ? null : roleStake, // Role stake
            appStake.eq(Zero) ? null : appStake, // Application stake
            applicationText // Human readable text
          );

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
        })
        .catch((e) => { reject(e); });
    });
  }

  leaveRole (group: WorkingGroups, sourceAccount: string, id: number, rationale: string, txSuccessCb?: () => void) {
    const tx = this.txByGroup(group).leaveRole(
      id,
      rationale
    );

    this.queueExtrinsic({
      accountId: sourceAccount,
      extrinsic: tx,
      txSuccessCb
    });
  }

  withdrawApplication (group: WorkingGroups, sourceAccount: string, id: number, txSuccessCb?: () => void) {
    const tx = this.txByGroup(group).withdrawApplication(
      id
    );

    this.queueExtrinsic({
      accountId: sourceAccount,
      extrinsic: tx,
      txSuccessCb
    });
  }
}
