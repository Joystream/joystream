import React from "react";

import { Container } from "semantic-ui-react";
import Details from "./Details";
import Body from "./Body";
import VotingSection from "./VotingSection";
import { MyAccountProps, withMyAccount } from "@polkadot/joy-utils/MyAccount"
import { ParsedProposal } from "../runtime/transport";
import { withCalls } from '@polkadot/react-api';
import { withMulti } from '@polkadot/react-api/with';

import "./Proposal.css";
import { ProposalId } from "@joystream/types/proposals";
import { BlockNumber } from '@polkadot/types/interfaces'
import { MemberId } from "@joystream/types/members";
import { Seat } from "@joystream/types/";

export type ExtendedProposalStatus = {
  statusStr: string, // TODO: Active / Finalized?
  substage: 'Voting period' | 'Grace period' | null,
  expiresIn: number | null,
}

export function getExtendedStatus(proposal: ParsedProposal, bestNumber: BlockNumber | undefined): ExtendedProposalStatus {
  const statusStr = Object.keys(proposal.status)[0];
  const isActive = statusStr === 'Active';
  const { votingPeriod, gracePeriod } = proposal.parameters;

  const blockAge = bestNumber ? (bestNumber.toNumber() - proposal.createdAtBlock) : 0;
  const substage =
    (
      isActive && (
      votingPeriod - blockAge  > 0 ?
        'Voting period'
        : 'Grace period'
      )
    ) || null;
  const expiresIn = substage && (
    substage === 'Voting period' ?
      votingPeriod - blockAge
      : (gracePeriod + votingPeriod) - blockAge
  )

  return {
    statusStr,
    substage,
    expiresIn
  }
}


type ProposalDetailsProps = MyAccountProps & {
  proposal: ParsedProposal,
  proposalId: ProposalId,
  bestNumber?: BlockNumber,
  council?: Seat[]
};

function ProposalDetails({ proposal, proposalId, myAddress, myMemberId, iAmMember, council, bestNumber }: ProposalDetailsProps) {
  const iAmCouncilMember = iAmMember && council && council.some(seat => seat.member.toString() === myAddress);
  const extendedStatus = getExtendedStatus(proposal, bestNumber);
  return (
    <Container className="Proposal">
      <Details proposal={proposal} extendedStatus={extendedStatus}/>
      <Body
        type={ proposal.type }
        title={ proposal.title }
        description={ proposal.description }
        params={ proposal.details }
        />
      { iAmCouncilMember && (
        <VotingSection
          proposalId={proposalId}
          memberId={ myMemberId as MemberId }
          isVotingPeriod={ extendedStatus.substage === 'Voting period' }/>
      ) }
      {/* <Votes votes={votes} total={totalVotes} />  TODO: Implement */}
    </Container>
  );
}

export default withMulti<ProposalDetailsProps>(
  ProposalDetails,
  withMyAccount,
  withCalls(
    ['derive.chain.bestNumber', { propName: 'bestNumber' }],
    ['query.council.activeCouncil', { propName: 'council' }], // TODO: Handle via transport?
  )
);
