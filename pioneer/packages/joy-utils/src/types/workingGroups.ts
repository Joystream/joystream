import { Worker, Opening as WGOpening } from '@joystream/types/working-group';
import { Profile } from '@joystream/types/members';
import { OpeningId, Opening, ApplicationStage } from '@joystream/types/hiring';
import { AccountId } from '@polkadot/types/interfaces';

export type LeadWithProfile = {
  worker: Worker;
  profile: Profile;
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
