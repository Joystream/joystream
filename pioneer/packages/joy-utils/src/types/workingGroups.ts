import { Worker, Opening as WGOpening } from '@joystream/types/working-group';
import { Membership } from '@joystream/types/members';
import { OpeningId, Opening, ApplicationStage } from '@joystream/types/hiring';
import { AccountId } from '@polkadot/types/interfaces';
import { WorkingGroupKey } from '@joystream/types/common';
import { RewardRelationship } from '@joystream/types/recurring-rewards';

export type WorkerData = {
  workerId: number;
  worker: Worker;
  profile: Membership;
  stake?: number;
  reward?: RewardRelationship;
  group: WorkingGroupKey;
};

export type OpeningData = {
  id: OpeningId;
  opening: WGOpening;
  hiringOpening: Opening;
}

export type ParsedApplication = {
  wgApplicationId: number;
  applicationId: number;
  member: Membership;
  roleAccout: AccountId;
  stakes: {
    application: number;
    role: number;
  };
  humanReadableText: string;
  stage: ApplicationStage;
}
