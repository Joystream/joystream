import { Membership } from '@joystream/types/members';

export type ParsedMember = {
  about: string;
  avatar_uri: string;
  handle: string;
  registered_at_block: number;
  registered_at_time: number;
  entry: { [k: string]: any };
  root_account: string;
  controller_account: string;
  subscription: any;
  suspended: boolean;
};

export type MemberFromAccount = { account: string; memberId?: number; profile?: Membership };
