import { Worker, Opening as WGOpening } from '@joystream/types/working-group';
import { Profile } from '@joystream/types/members';
import { OpeningId, Opening, ApplicationStage } from '@joystream/types/hiring';
import { AccountId } from '@polkadot/types/interfaces';
import { WorkingGroupKeys } from '@joystream/types/common';
import { RewardRelationship } from '@joystream/types/recurring-rewards';

export type WorkerData = {
  workerId: number;
  worker: Worker;
  profile: Profile;
  stake?: number;
  reward?: RewardRelationship;
  group: WorkingGroupKeys;
};

export type OpeningData = {
  id: OpeningId;
  opening: WGOpening;
  hiringOpening: Opening;
}

export type ParsedApplication = {
  wgApplicationId: number;
  applicationId: number;
  member: Profile;
  roleAccout: AccountId;
  stakes: {
    application: number;
    role: number;
  };
  humanReadableText: string;
  stage: ApplicationStage;
}
