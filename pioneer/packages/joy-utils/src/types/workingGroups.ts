import { Worker } from '@joystream/types/working-group';
import { Profile } from '@joystream/types/members';

export type LeadWithProfile = {
  worker: Worker;
  profile: Profile;
};
