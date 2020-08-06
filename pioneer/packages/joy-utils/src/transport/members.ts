import BaseTransport from './base';
import { MemberId, Membership } from '@joystream/types/members';

export default class MembersTransport extends BaseTransport {
  async membershipById (id: MemberId | number): Promise<Membership | null> {
    const member = (await this.members.membershipById(id)) as Membership;
    // Can't just use member.isEmpty because member.suspended is Bool (which isEmpty method always returns false)
    return member.handle.isEmpty ? null : member;
  }

  // Throws if profile not found
  async expectedMembership (id: MemberId | number): Promise<Membership> {
    const member = await this.membershipById(id);
    if (!member) {
      throw new Error(`Expected member profile not found! ID: ${id.toString()}`);
    }

    return member;
  }

  async nextMemberId (): Promise<number> {
    return (await this.members.nextMemberId() as MemberId).toNumber();
  }
}
