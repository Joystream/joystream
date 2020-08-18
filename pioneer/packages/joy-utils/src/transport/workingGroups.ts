import { Option } from '@polkadot/types/';
import { Balance } from '@polkadot/types/interfaces';
import BaseTransport from './base';
import { ApiPromise } from '@polkadot/api';
import MembersTransport from './members';
import { Worker, WorkerId, Opening as WGOpening, Application as WGApplication, OpeningTypeKey } from '@joystream/types/working-group';
import { apiModuleByGroup } from '../consts/workingGroups';
import { WorkingGroupKey } from '@joystream/types/common';
import { WorkerData, OpeningData, ParsedApplication } from '../types/workingGroups';
import { OpeningId, ApplicationId, Opening, Application, ActiveOpeningStageKey } from '@joystream/types/hiring';
import { Stake, StakeId } from '@joystream/types/stake';
import { RewardRelationship } from '@joystream/types/recurring-rewards';
import { APIQueryCache } from './APIQueryCache';

export default class WorkingGroupsTransport extends BaseTransport {
  private membersT: MembersTransport;

  constructor (api: ApiPromise, cacheApi: APIQueryCache, membersTransport: MembersTransport) {
    super(api, cacheApi);
    this.membersT = membersTransport;
  }

  protected apiQueryByGroup(group: WorkingGroupKey) {
    const module = apiModuleByGroup[group];
    return this.api.query[module];
  }

  protected queryByGroup (group: WorkingGroupKey) {
    const module = apiModuleByGroup[group];
    return this.cacheApi.query[module];
  }

  public async groupMemberById (group: WorkingGroupKey, workerId: number): Promise<WorkerData | null> {
    const worker = await this.queryByGroup(group).workerById(workerId) as Worker;

    if (worker.isEmpty) {
      return null;
    }

    const stake = worker.role_stake_profile.isSome
      ? (await this.stakeValue(worker.role_stake_profile.unwrap().stake_id)).toNumber()
      : undefined;

    const reward = worker.reward_relationship.isSome
      ? (await this.recurringRewards.rewardRelationships(worker.reward_relationship.unwrap()) as RewardRelationship)
      : undefined;

    const profile = await this.membersT.expectedMembership(worker.member_id);

    return { group, workerId, worker, profile, stake, reward };
  }

  public async currentLead (group: WorkingGroupKey): Promise<WorkerData | null> {
    const optLeadId = (await this.queryByGroup(group).currentLead()) as Option<WorkerId>;

    if (!optLeadId.isSome) {
      return null;
    }

    const leadWorkerId = optLeadId.unwrap().toNumber();

    return this.groupMemberById(group, leadWorkerId);
  }

  public async allOpenings (group: WorkingGroupKey, type?: OpeningTypeKey): Promise<OpeningData[]> {
    const wgOpeningEntries = await this.entriesByIds<OpeningId, WGOpening>(this.apiQueryByGroup(group).openingById);
    const hiringOpenings = await Promise.all(
      wgOpeningEntries.map(
        ([wgOpeningId, wgOpening]) => this.hiring.openingById(wgOpening.hiring_opening_id)
      )
    ) as Opening[];

    return hiringOpenings
      .map((hiringOpening, index) => {
        const id = wgOpeningEntries[index][0];
        const opening = wgOpeningEntries[index][1];

        return { id, opening, hiringOpening };
      })
      .filter(openingData => !type || openingData.opening.opening_type.isOfType(type));
  }

  public async activeOpenings (group: WorkingGroupKey, substage?: ActiveOpeningStageKey, type?: OpeningTypeKey) {
    return (await this.allOpenings(group, type))
      .filter(od =>
        od.hiringOpening.stage.isOfType('Active') &&
        (!substage || od.hiringOpening.stage.asType('Active').stage.isOfType(substage))
      );
  }

  async wgApplicationById (group: WorkingGroupKey, wgApplicationId: number | ApplicationId): Promise<WGApplication> {
    const wgApplication = (await this.queryByGroup(group).applicationById(wgApplicationId)) as WGApplication;

    if (wgApplication.isEmpty) {
      throw new Error(`Working group application not found (ID: ${wgApplicationId})!`);
    }

    return wgApplication;
  }

  protected async stakeValue (stakeId: StakeId): Promise<Balance> {
    const stake = await this.stake.stakes(stakeId) as Stake;

    return stake.value;
  }

  protected async parseApplication (wgApplicationId: number, wgApplication: WGApplication): Promise<ParsedApplication> {
    const appId = wgApplication.application_id;
    const application = await this.hiring.applicationById(appId) as Application;

    const { active_role_staking_id: roleStakingId, active_application_staking_id: appStakingId } = application;

    return {
      wgApplicationId,
      applicationId: appId.toNumber(),
      member: await this.membersT.expectedMembership(wgApplication.member_id),
      roleAccout: wgApplication.role_account_id,
      stakes: {
        application: appStakingId.isSome ? (await this.stakeValue(appStakingId.unwrap())).toNumber() : 0,
        role: roleStakingId.isSome ? (await this.stakeValue(roleStakingId.unwrap())).toNumber() : 0
      },
      humanReadableText: application.human_readable_text.toString(),
      stage: application.stage
    };
  }

  async parsedApplicationById (group: WorkingGroupKey, wgApplicationId: number): Promise<ParsedApplication> {
    const wgApplication = await this.wgApplicationById(group, wgApplicationId);
    return this.parseApplication(wgApplicationId, wgApplication);
  }

  async openingApplications (group: WorkingGroupKey, wgOpeningId: number): Promise<ParsedApplication[]> {
    const wgApplicationsEntries =
      await this.entriesByIds<ApplicationId, WGApplication>(this.apiQueryByGroup(group).applicationById);

    return Promise.all(
      wgApplicationsEntries
        .filter(
          ([wgApplicationById, wgApplication]) => wgApplication.opening_id.eq(wgOpeningId)
        )
        .map(
          ([wgApplicationId, wgApplication]) => (
            this.parseApplication(wgApplicationId.toNumber(), wgApplication)
          )
        )
    );
  }

  async openingActiveApplications (group: WorkingGroupKey, wgOpeningId: number): Promise<ParsedApplication[]> {
    return (await this.openingApplications(group, wgOpeningId))
      .filter(a => a.stage.isOfType('Active'));
  }
}
