import React from "react";

import { Icon, Button, Message } from "semantic-ui-react";

import { VoteValue } from "./ProposalDetails";

type VotingSectionProps = {
  onVote?: (vote: VoteValue) => void;
  hasVoted?: boolean;
  value?: VoteValue;
};

export default function VotingSection({ onVote, hasVoted, value }: VotingSectionProps) {
  if (hasVoted) {
    let icon;
    let color;
    switch (value) {
      case "Approve": {
        icon = "smile";
        color = "green";
        break;
      }
      case "Abstain": {
        icon = "meh";
        color = "gray";
        break;
      }
      case "Reject": {
        icon = "frown";
        color = "orange";
        break;
      }
      case "Slash": {
        icon = "times";
        color = "red";
        break;
      }
    }
    console.log({ color, icon, value });
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
