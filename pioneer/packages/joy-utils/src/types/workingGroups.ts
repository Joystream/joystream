import { Worker, Opening as WGOpening } from '@joystream/types/working-group';
import { Profile } from '@joystream/types/members';
import { OpeningId, Opening } from '@joystream/types/hiring';

export type LeadWithProfile = {
  worker: Worker;
  profile: Profile;
};

export type OpeningData = {
  id: OpeningId;
  opening: WGOpening;
  hiringOpening: Opening;
}
