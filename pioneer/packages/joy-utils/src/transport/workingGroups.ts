import { Option } from '@polkadot/types/';
import BaseTransport from './base';
import { ApiPromise } from '@polkadot/api';
import MembersTransport from './members';
import { SingleLinkedMapEntry } from '../index';
import { Worker, WorkerId } from '@joystream/types/working-group';
import { apiModuleByGroup } from '../consts/workingGroups';
import { WorkingGroupKeys } from '@joystream/types/common';
import { LeadWithProfile } from '../types/workingGroups';

export default class WorkingGroupsTransport extends BaseTransport {
  private membersT: MembersTransport;

  constructor (api: ApiPromise, membersTransport: MembersTransport) {
    super(api);
    this.membersT = membersTransport;
  }

  protected queryByGroup (group: WorkingGroupKeys) {
    const module = apiModuleByGroup[group];
    return this.api.query[module];
  }

  public async currentLead (group: WorkingGroupKeys): Promise <LeadWithProfile | null> {
    const optLeadId = (await this.queryByGroup(group).currentLead()) as Option<WorkerId>;

    if (!optLeadId.isSome) {
      return null;
    }

    const leadWorkerId = optLeadId.unwrap();
    const leadWorkerLink = new SingleLinkedMapEntry(
      Worker,
      await this.queryByGroup(group).workerById(leadWorkerId)
    );
    const leadWorker = leadWorkerLink.value;

    if (!leadWorker.is_active) {
      return null;
    }

    return {
      worker: leadWorker,
      profile: await this.membersT.expectedMemberProfile(leadWorker.member_id)
    };
  }
}
