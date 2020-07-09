import { Option } from '@polkadot/types/';
import BaseTransport from './base';
import { ApiPromise } from '@polkadot/api';
import MembersTransport from './members';
import { SingleLinkedMapEntry } from '../index';
import { Worker, WorkerId, Opening as WGOpening } from '@joystream/types/working-group';
import { apiModuleByGroup } from '../consts/workingGroups';
import { WorkingGroupKeys } from '@joystream/types/common';
import { LeadWithProfile, OpeningData } from '../types/workingGroups';
import { OpeningId, Opening } from '@joystream/types/hiring';
import { MultipleLinkedMapEntry } from '../LinkedMapEntry';

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

  public async allOpenings (group: WorkingGroupKeys): Promise<OpeningData[]> {
    const nextId = (await this.queryByGroup(group).nextOpeningId()) as OpeningId;

    if (nextId.eq(0)) {
      return [];
    }

    const query = this.queryByGroup(group).openingById();
    const result = new MultipleLinkedMapEntry(OpeningId, WGOpening, await query);

    const openingsData: OpeningData[] = [];
    for (const [index, opening] of Object.entries(result.linked_values.toArray())) {
      const id = result.linked_keys[parseInt(index)];
      const hiringId = opening.hiring_opening_id;
      const hiringOpening = (new SingleLinkedMapEntry(Opening, await this.hiring.openingById(hiringId))).value;
      openingsData.push({ id, opening, hiringOpening });
    }

    return openingsData;
  }
}
