import React from "react";

import { Icon, Button, Message, Divider, Header } from "semantic-ui-react";

import { VoteValue } from "./ProposalDetails";
import useVoteStyles from "./useVoteStyles";

type VotingSectionProps = {
  onVote?: (vote: VoteValue) => void;
  hasVoted?: boolean;
  value?: VoteValue;
};

export default function VotingSection({ onVote, hasVoted, value }: VotingSectionProps) {
  if (hasVoted) {
    let { icon, color } = useVoteStyles(value);

    return (
      <Message icon color={color}>
        <Icon name={icon} />
        <Message.Content>
          You voted <span className="bold">{`"${value}"`}</span>
        </Message.Content>
      </Message>
    );
  }
  return (
    <>
      <Header as="h3">Submit your vote</Header>
      <Divider />
      <Button color="green" icon labelPosition="left" onPress={() => onVote("Approve")}>
        <Icon name="smile" inverted />
        Approve
      </Button>
      <Button color="grey" icon labelPosition="left" onPress={() => onVote("Abstain")}>
        <Icon name="meh" inverted />
        Abstain
      </Button>
      <Button color="orange" icon labelPosition="left" onPress={() => onVote("Reject")}>
        <Icon name="frown" inverted />
        Reject
      </Button>
      <Button color="red" icon labelPosition="left" onPress={() => onVote("Slash")}>
        <Icon name="times" inverted />
        Slash
      </Button>
    </>
  );
}
