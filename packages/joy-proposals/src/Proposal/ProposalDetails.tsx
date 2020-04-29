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


type ProposalDetailsProps = MyAccountProps & {
  proposal: ParsedProposal,
  proposalId: ProposalId,
  bestNumber?: BlockNumber,
  council?: Seat[]
};

function ProposalDetails({ proposal, proposalId, myAddress, myMemberId, iAmMember, council, bestNumber }: ProposalDetailsProps) {
  const iAmCouncilMember = iAmMember && council && council.some(seat => seat.member.toString() === myAddress);
  return (
    <Container className="Proposal">
      <Details proposal={proposal} bestNumber={bestNumber}/>
      <Body
        type={ proposal.type }
        title={ proposal.title }
        description={ proposal.description }
        params={ proposal.details }
        />
      { iAmCouncilMember && <VotingSection proposalId={proposalId} memberId={ myMemberId as MemberId }/> }
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
