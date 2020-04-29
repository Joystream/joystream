import React, { useState } from "react";

import { Icon, Button, Message, Divider, Header } from "semantic-ui-react";
import useVoteStyles from "./useVoteStyles";
import TxButton from "@polkadot/joy-utils/TxButton";
import { MemberId } from "@joystream/types/members";
import { ProposalId } from "@joystream/types/proposals";
import { useTransport } from "../runtime";
import { VoteKind } from '@joystream/types/proposals';
import { usePromise } from "../utils";

// TODO: joy-types (there's something similar already I think)
const voteKinds = ["Approve", "Slash", "Abstain", "Reject"] as const;
export type VoteKindStr = "Approve" | "Slash" | "Abstain" | "Reject";

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
    () => transport.voteByProposalAndMember(proposalId, memberId),
    undefined
  );

  if (vote === undefined) {
    // Loading / error
    return null;
  }

  const voteStr: VoteKindStr | null = voted ? voted : (vote && vote.type.toString() as VoteKindStr);

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
      { voteKinds.map((voteKind) =>
        <VoteButton
          voteKind={voteKind}
          memberId={memberId}
          proposalId={proposalId}
          key={voteKind}
          onSuccess={ () => setVoted(voteKind) }/>
      ) }
    </>
  );
}
