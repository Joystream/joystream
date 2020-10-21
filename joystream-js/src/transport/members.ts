import BaseTransport from './base'
import { MemberId, Membership } from '@joystream/types/members'
import { AccountId } from '@polkadot/types/interfaces'
import { MemberFromAccount } from '../types/members'

export default class MembersTransport extends BaseTransport {
  // Shortcuts
  idsByController = this.members.memberIdsByControllerAccountId
  idsByRoot = this.members.memberIdsByRootAccountId

  async membershipById(id: MemberId | number): Promise<Membership | null> {
    const member = await this.members.membershipById(id)

    return member.isEmpty ? null : member
  }

  // Throws if profile not found
  async expectedMembership(id: MemberId | number): Promise<Membership> {
    const member = await this.membershipById(id)

    if (!member) {
      throw new Error(`Expected member profile not found! ID: ${id.toString()}`)
    }

    return member
  }

  async nextMemberId(): Promise<number> {
    return ((await this.members.nextMemberId()) as MemberId).toNumber()
  }

  async membershipFromAccount(accountId: AccountId | string): Promise<MemberFromAccount> {
    const memberIdsRoot = await this.idsByRoot(accountId)
    const memberIdsController = await this.idsByController(accountId)
    const memberId: MemberId | undefined = memberIdsRoot.toArray().concat(memberIdsController.toArray())[0]
    const profile = memberId ? await this.expectedMembership(memberId) : undefined

    return {
      account: accountId.toString(),
      memberId: memberId && memberId.toNumber(),
      profile,
    }
  }

  async allMembers(): Promise<[MemberId, Membership][]> {
    return this.entriesByIds<MemberId, Membership>(this.api.query.members.membershipById)
  }
}
