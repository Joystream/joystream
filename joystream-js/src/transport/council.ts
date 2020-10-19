import { ParsedMember } from '../types/members'
import BaseTransport from './base'
import { Seats, IElectionParameters } from '@joystream/types/council'
import { MemberId, Membership } from '@joystream/types/members'
import { u32, Vec } from '@polkadot/types/'
import { Balance, BlockNumber } from '@polkadot/types/interfaces'
import { ApiPromise } from '@polkadot/api'
import MembersTransport from './members'
import ChainTransport from './chain'
import { APIQueryCache } from './APIQueryCache'

export default class CouncilTransport extends BaseTransport {
  private membersT: MembersTransport
  private chainT: ChainTransport

  constructor(
    api: ApiPromise,
    cacheApi: APIQueryCache,
    membersTransport: MembersTransport,
    chainTransport: ChainTransport
  ) {
    super(api, cacheApi)
    this.membersT = membersTransport
    this.chainT = chainTransport
  }

  async councilMembersLength(atBlock?: number): Promise<number> {
    if (atBlock) {
      const blockHash = await this.chainT.blockHash(atBlock)
      const seats = await this.api.query.council.activeCouncil.at<Seats>(blockHash)

      return seats.length
    }

    return ((await this.council.activeCouncil()) as Seats).length
  }

  async councilMembers(): Promise<(ParsedMember & { memberId: MemberId })[]> {
    const council = (await this.council.activeCouncil()) as Seats

    return Promise.all(
      council.map(async (seat) => {
        const memberIds = (await this.members.memberIdsByControllerAccountId(seat.member)) as Vec<MemberId>
        const member = (await this.membersT.expectedMembership(memberIds[0])).toJSON() as ParsedMember

        return {
          ...member,
          memberId: memberIds[0],
        }
      })
    )
  }

  async membersExceptCouncil(): Promise<{ id: number; profile: Membership }[]> {
    // Council members to filter out
    const activeCouncil = (await this.council.activeCouncil()) as Seats

    return (await this.membersT.allMembers())
      .filter(
        ([memberId, member]) =>
          // Filter out council members
          !activeCouncil.some(
            (seat) => seat.member.eq(member.controller_account) || seat.member.eq(member.root_account)
          )
      )
      .map(([memberId, member]) => ({ id: memberId.toNumber(), profile: member }))
  }

  async electionParameters() {
    const announcingPeriod = (await this.councilElection.announcingPeriod()) as BlockNumber
    const votingPeriod = (await this.councilElection.votingPeriod()) as BlockNumber
    const revealingPeriod = (await this.councilElection.revealingPeriod()) as BlockNumber
    const newTermDuration = (await this.councilElection.newTermDuration()) as BlockNumber
    const minCouncilStake = (await this.councilElection.minCouncilStake()) as Balance
    const minVotingStake = (await this.councilElection.minVotingStake()) as Balance
    const candidacyLimit = (await this.councilElection.candidacyLimit()) as u32
    const councilSize = (await this.councilElection.councilSize()) as u32

    return {
      announcingPeriod,
      votingPeriod,
      revealingPeriod,
      newTermDuration,
      minCouncilStake,
      minVotingStake,
      candidacyLimit,
      councilSize,
    }
  }
}
