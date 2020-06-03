import React, { useState } from "react";

import { Icon, Button, Message, Divider, Header } from "semantic-ui-react";
import useVoteStyles from "./useVoteStyles";
import TxButton from "@polkadot/joy-utils/TxButton";
import { MemberId } from "@joystream/types/members";
import { ProposalId } from "@joystream/types/proposals";
import { useTransport, usePromise } from "@polkadot/joy-utils/react/hooks";
import { VoteKind } from '@joystream/types/proposals';
import { VoteKinds } from "@joystream/types/proposals";
import styled from 'styled-components';

const VoteButtons = styled.div`
  display: grid;
  grid-gap: 0.5rem;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr 1fr;
  @media screen and (max-width: 1199px) {
    grid-template-rows: auto;
    grid-template-columns: repeat(4, 1fr);
  }
  @media screen and (max-width: 767px) {
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
  }
`;

export type VoteKindStr = typeof VoteKinds[number];

type VoteButtonProps = {
  memberId: MemberId,
  voteKind: VoteKindStr,
  proposalId: ProposalId,
  onSuccess: () => void
}
function VoteButton({ voteKind, proposalId, memberId, onSuccess }: VoteButtonProps) {
  const { icon, color } = useVoteStyles(voteKind);
  return (
    // Button.Group "cheat" to force TxButton color
    <Button.Group color={color} style={{ marginRight: '5px' }}>
      <TxButton
        // isDisabled={ isSubmitting }
        params={[
          memberId,
          proposalId,
          voteKind
        ]}
        tx={ `proposalsEngine.vote` }
        onClick={ sendTx => sendTx() }
        txFailedCb={ () => null }
        txSuccessCb={ onSuccess }
        className={`icon left labeled`}>
        <Icon name={icon} inverted />
        { voteKind }
      </TxButton>
    </Button.Group>
  )
}

type VotingSectionProps = {
  memberId: MemberId,
  proposalId: ProposalId,
  isVotingPeriod: boolean,
};

export default function VotingSection({
  memberId,
  proposalId,
  isVotingPeriod
}: VotingSectionProps) {
  const transport = useTransport();
  const [voted, setVoted] = useState<VoteKindStr | null >(null);
  const [vote] = usePromise<VoteKind | null | undefined>(
    () => transport.proposals.voteByProposalAndMember(proposalId, memberId),
    undefined
  );

  if (vote === undefined) {
    // Loading / error
    return null;
  }

  const voteStr: VoteKindStr | null = voted || (vote && vote.type.toString() as VoteKindStr);

  if (voteStr) {
    const { icon, color } = useVoteStyles(voteStr);

    return (
      <Message icon color={color}>
        <Icon name={icon} />
        <Message.Content>
          You voted <span className="bold">{`"${voteStr}"`}</span>
        </Message.Content>
      </Message>
    );
  }
  else if (!isVotingPeriod) {
    return null;
  }

  return (
    <>
      <Header as="h3">Sumbit your vote</Header>
      <Divider />
      <VoteButtons>
        { VoteKinds.map((voteKind) =>
          <VoteButton
            voteKind={voteKind}
            memberId={memberId}
            proposalId={proposalId}
            key={voteKind}
            onSuccess={ () => setVoted(voteKind) }/>
        ) }
      </VoteButtons>
    </>
  );
}
