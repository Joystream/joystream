import { ParsedMember } from "../types/members";
import BaseTransport from './base';
import { Seats, ElectionParameters } from "@joystream/types/proposals";
import { MemberId, Profile } from "@joystream/types/members";
import { u32, Vec } from "@polkadot/types/";
import { Balance, BlockNumber } from "@polkadot/types/interfaces";
import { FIRST_MEMBER_ID } from "../consts/members";
import { ApiPromise } from "@polkadot/api";
import MembersTransport from "./members";

export default class CouncilTransport extends BaseTransport {
  private membersT: MembersTransport;

  constructor(api: ApiPromise, membersTransport: MembersTransport) {
    super(api);
    this.membersT = membersTransport;
  }

  async councilMembers(): Promise<(ParsedMember & { memberId: MemberId })[]> {
    const council = (await this.council.activeCouncil()) as Seats;
    return Promise.all(
      council.map(async seat => {
        const memberIds = (await this.members.memberIdsByControllerAccountId(seat.member)) as Vec<MemberId>;
        const member = (await this.membersT.memberProfile(memberIds[0])).toJSON() as ParsedMember;
        return {
          ...member,
          memberId: memberIds[0]
        };
      })
    );
  }

  async membersExceptCouncil(): Promise<{ id: number; profile: Profile }[]> {
    // Council members to filter out
    const activeCouncil = (await this.council.activeCouncil()) as Seats;
    const membersCount = ((await this.members.membersCreated()) as MemberId).toNumber();
    const profiles: { id: number; profile: Profile }[] = [];
    for (let id = FIRST_MEMBER_ID.toNumber(); id < membersCount; ++id) {
      const profile = (await this.membersT.memberProfile(new MemberId(id))).unwrapOr(null);
      if (
        !profile ||
        // Filter out council members
        activeCouncil.some(
          seat =>
            seat.member.toString() === profile.controller_account.toString() ||
            seat.member.toString() === profile.root_account.toString()
        )
      ) {
        continue;
      }
      profiles.push({ id, profile });
    }

    return profiles;
  }

  async electionParameters(): Promise<ElectionParameters> {
    const announcing_period = (await this.councilElection.announcingPeriod()) as BlockNumber;
    const voting_period = (await this.councilElection.votingPeriod()) as BlockNumber;
    const revealing_period = (await this.councilElection.revealingPeriod()) as BlockNumber;
    const new_term_duration = (await this.councilElection.newTermDuration()) as BlockNumber;
    const min_council_stake = (await this.councilElection.minCouncilStake()) as Balance;
    const min_voting_stake = (await this.councilElection.minVotingStake()) as Balance;
    const candidacy_limit = (await this.councilElection.candidacyLimit()) as u32;
    const council_size = (await this.councilElection.councilSize()) as u32;

    return new ElectionParameters({
      announcing_period,
      voting_period,
      revealing_period,
      new_term_duration,
      min_council_stake,
      min_voting_stake,
      candidacy_limit,
      council_size
    });
  }
}
