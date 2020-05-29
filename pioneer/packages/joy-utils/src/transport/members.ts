import BaseTransport from './base';
import { MemberId, Profile } from "@joystream/types/members";
import { Option } from "@polkadot/types/";

export default class MembersTransport extends BaseTransport {
  memberProfile(id: MemberId | number): Promise<Option<Profile>> {
    return this.members.memberProfile(id) as Promise<Option<Profile>>;
  }
}
