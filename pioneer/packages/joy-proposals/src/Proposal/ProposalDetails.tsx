import React from 'react';

import { Container } from 'semantic-ui-react';
import Details from './Details';
import Body from './Body';
import VotingSection from './VotingSection';
import Votes from './Votes';
import { MyAccountProps, withMyAccount } from '@polkadot/joy-utils/MyAccount';
import { ParsedProposal, ProposalVote } from '@polkadot/joy-utils/types/proposals';
import { withCalls } from '@polkadot/react-api';
import { withMulti } from '@polkadot/react-api/with';

import './Proposal.css';
import { ProposalId, ProposalDecisionStatuses, ApprovedProposalStatuses, ExecutionFailedStatus } from '@joystream/types/proposals';
import { BlockNumber } from '@polkadot/types/interfaces';
import { MemberId } from '@joystream/types/members';
import { Seat } from '@joystream/types/';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';

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

export function getExtendedStatus (proposal: ParsedProposal, bestNumber: BlockNumber | undefined): ExtendedProposalStatus {
  const basicStatus = Object.keys(proposal.status)[0] as BasicProposalStatus;
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
    expiresIn = Math.max(votingPeriod - blockAge, 0) || null;
  }

  if (basicStatus === 'Finalized') {
    const { finalizedAt, proposalStatus } = proposal.status.Finalized;
    const decisionStatus: ProposalDecisionStatuses = Object.keys(proposalStatus)[0] as ProposalDecisionStatuses;
    displayStatus = decisionStatus;
    finalizedAtBlock = finalizedAt as number;
    if (decisionStatus === 'Approved') {
      const approvedStatus: ApprovedProposalStatuses = Object.keys(proposalStatus.Approved)[0] as ApprovedProposalStatuses;
      if (approvedStatus === 'PendingExecution') {
        const finalizedAge = best - finalizedAt;
        periodStatus = 'Grace period';
        expiresIn = Math.max(gracePeriod - finalizedAge, 0) || null;
      } else {
        // Executed / ExecutionFailed
        displayStatus = approvedStatus;
        executedAtBlock = finalizedAtBlock + gracePeriod;
        if (approvedStatus === 'ExecutionFailed') {
          const executionFailedStatus = proposalStatus.Approved.ExecutionFailed as ExecutionFailedStatus;
          executionFailReason = Buffer.from(executionFailedStatus.error.toString().replace('0x', ''), 'hex').toString();
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
  votesListState: { data: ProposalVote[]; error: any; loading: boolean };
  bestNumber?: BlockNumber;
  council?: Seat[];
};

function ProposalDetails ({
  proposal,
  proposalId,
  myAddress,
  myMemberId,
  iAmMember,
  council,
  bestNumber,
  votesListState
}: ProposalDetailsProps) {
  const iAmCouncilMember = Boolean(iAmMember && council && council.some(seat => seat.member.toString() === myAddress));
  const iAmProposer = Boolean(iAmMember && myMemberId !== undefined && proposal.proposerId === myMemberId.toNumber());
  const extendedStatus = getExtendedStatus(proposal, bestNumber);
  const isVotingPeriod = extendedStatus.periodStatus === 'Voting period';
  return (
    <Container className="Proposal">
      <Details proposal={proposal} extendedStatus={extendedStatus} proposerLink={ true }/>
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
      />
      { iAmCouncilMember && (
        <VotingSection
          proposalId={proposalId}
          memberId={ myMemberId as MemberId }
          isVotingPeriod={ isVotingPeriod }/>
      ) }
      <PromiseComponent
        error={votesListState.error}
        loading={votesListState.loading}
        message="Fetching the votes...">
        <Votes votes={votesListState.data} />
      </PromiseComponent>
    </Container>
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
