import React from 'react';

import Details from './Details';
import Body from './Body';
import VotingSection from './VotingSection';
import Votes from './Votes';
import { MyAccountProps, withMyAccount } from '@polkadot/joy-utils/react/hocs/accounts';
import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';
import { withCalls } from '@polkadot/react-api';
import { withMulti } from '@polkadot/react-api/hoc';
import { ProposalId, ProposalDecisionStatuses, ApprovedProposalStatuses } from '@joystream/types/proposals';
import { BlockNumber } from '@polkadot/types/interfaces';
import { MemberId } from '@joystream/types/members';
import { Seat } from '@joystream/types/council';
import ProposalDiscussion from './discussion/ProposalDiscussion';

import styled from 'styled-components';
import { bytesToString } from '@polkadot/joy-utils/functions/misc';

const ProposalDetailsMain = styled.div`
  display: flex;
  @media screen and (max-width: 1199px) {
    flex-direction: column;
  }
`;

const ProposalDetailsVoting = styled.div`
  min-width: 30%;
  margin-left: 3%;
  @media screen and (max-width: 1399px) {
    min-width: 40%;
  }
  @media screen and (max-width: 1199px) {
    margin-left: 0;
  }
`;

const ProposalDetailsDiscussion = styled.div`
  margin-top: 1rem;
  max-width: 67%;
  @media screen and (max-width: 1399px) {
    max-width: none;
  }
`;

// TODO: That should probably be moved to joy-utils/functions/proposals (or transport)
type BasicProposalStatus = 'Active' | 'Finalized';
type ProposalPeriodStatus = 'Voting period' | 'Grace period';
type ProposalDisplayStatus = BasicProposalStatus | ProposalDecisionStatuses | ApprovedProposalStatuses;

export type ExtendedProposalStatus = {
  displayStatus: ProposalDisplayStatus;
  periodStatus: ProposalPeriodStatus | null;
  expiresIn: number | null;
  finalizedAtBlock: number | null;
  executedAtBlock: number | null;
  executionFailReason: string | null;
}

export function getExtendedStatus (proposal: ParsedProposal, bestNumber?: BlockNumber): ExtendedProposalStatus {
  const basicStatus: BasicProposalStatus = proposal.status.type;
  let expiresIn: number | null = null;

  let displayStatus: ProposalDisplayStatus = basicStatus;
  let periodStatus: ProposalPeriodStatus | null = null;
  let finalizedAtBlock: number | null = null;
  let executedAtBlock: number | null = null;
  let executionFailReason: string | null = null;

  const best = bestNumber ? bestNumber.toNumber() : 0;

  const { votingPeriod, gracePeriod } = proposal.parameters;
  const blockAge = best - proposal.createdAtBlock;

  if (basicStatus === 'Active') {
    periodStatus = 'Voting period';
    expiresIn = Math.max(votingPeriod.toNumber() - blockAge, 0) || null;
  }

  if (basicStatus === 'Finalized') {
    const { finalizedAt, proposalStatus } = proposal.status.asType('Finalized');
    const decisionStatus: ProposalDecisionStatuses = proposalStatus.type;

    displayStatus = decisionStatus;
    finalizedAtBlock = finalizedAt.toNumber();

    if (decisionStatus === 'Approved') {
      const approvedStatus: ApprovedProposalStatuses = proposalStatus.asType('Approved').type;

      if (approvedStatus === 'PendingExecution') {
        const finalizedAge = best - finalizedAt.toNumber();

        periodStatus = 'Grace period';
        expiresIn = Math.max(gracePeriod.toNumber() - finalizedAge, 0) || null;
      } else {
        // Executed / ExecutionFailed
        displayStatus = approvedStatus;
        executedAtBlock = finalizedAtBlock + gracePeriod.toNumber();

        if (approvedStatus === 'ExecutionFailed') {
          const executionFailedStatus = proposalStatus.asType('Approved').asType('ExecutionFailed');

          executionFailReason = bytesToString(executionFailedStatus.error);
        }
      }
    }
  }

  return {
    displayStatus,
    periodStatus,
    expiresIn: best ? expiresIn : null,
    finalizedAtBlock,
    executedAtBlock,
    executionFailReason
  };
}

type ProposalDetailsProps = MyAccountProps & {
  proposal: ParsedProposal;
  proposalId: ProposalId;
  bestNumber?: BlockNumber;
  council?: Seat[];
  historical?: boolean;
};

function ProposalDetails ({
  proposal,
  proposalId,
  myAddress,
  myMemberId,
  iAmMember,
  council,
  bestNumber,
  historical
}: ProposalDetailsProps) {
  const iAmCouncilMember = Boolean(iAmMember && council && council.some((seat) => seat.member.toString() === myAddress));
  const iAmProposer = Boolean(iAmMember && myMemberId !== undefined && proposal.proposerId === myMemberId.toNumber());
  const extendedStatus = getExtendedStatus(proposal, historical ? undefined : bestNumber);
  const isVotingPeriod = extendedStatus.periodStatus === 'Voting period';

  return (
    <div className='Proposal'>
      <Details proposal={proposal} extendedStatus={extendedStatus} proposerLink={ true }/>
      <ProposalDetailsMain>
        <Body
          type={ proposal.type }
          title={ proposal.title }
          description={ proposal.description }
          params={ proposal.details }
          iAmProposer={ iAmProposer }
          proposalId={ proposalId }
          proposerId={ proposal.proposerId }
          isCancellable={ isVotingPeriod }
          cancellationFee={ proposal.cancellationFee }
          historical={historical}
        />
        <ProposalDetailsVoting>
          { (iAmCouncilMember && !historical) && (
            <VotingSection
              proposalId={proposalId}
              memberId={ myMemberId as MemberId }
              isVotingPeriod={ isVotingPeriod }/>
          ) }
          <Votes proposal={proposal} historical={historical}/>
        </ProposalDetailsVoting>
      </ProposalDetailsMain>
      <ProposalDetailsDiscussion>
        <ProposalDiscussion
          proposalId={proposalId}
          memberId={ iAmMember ? myMemberId : undefined }
          historical={historical}/>
      </ProposalDetailsDiscussion>
    </div>
  );
}

export default withMulti<ProposalDetailsProps>(
  ProposalDetails,
  withMyAccount,
  withCalls(
    ['derive.chain.bestNumber', { propName: 'bestNumber' }],
    ['query.council.activeCouncil', { propName: 'council' }] // TODO: Handle via transport?
  )
);
