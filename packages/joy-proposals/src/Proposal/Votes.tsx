import React from "react";
import { IdentityIcon } from '@polkadot/react-components';
import { Header, Divider, Table, Image, Icon } from "semantic-ui-react";
import useVoteStyles from "./useVoteStyles";
import { ProposalVote } from "../runtime";
import { VoteKind } from "@joystream/types/proposals";
import { VoteKindStr } from "./VotingSection";

type VotesProps = {
  votes: ProposalVote[]
};

export default function Votes({ votes }: VotesProps) {
  const nonEmptyVotes = votes.filter(proposalVote => proposalVote.vote !== null);

  if (!nonEmptyVotes.length) {
    return (
      <Header as="h3">
        No votes submitted yet!
      </Header>
    );
  }

  return (
    <>
      <Header as="h3">
        All Votes: ({nonEmptyVotes.length} / {votes.length})
      </Header>
      <Divider />
      <Table basic="very">
        <Table.Body>
          {nonEmptyVotes.map((proposalVote, idx) => {
            const { vote, member } = proposalVote;
            const voteStr = (vote as VoteKind).type.toString() as VoteKindStr;
            const { icon, textColor } = useVoteStyles(voteStr);
            return (
              <Table.Row key={`${member.handle}-${idx}`}>
                <Table.Cell className={textColor}>
                  <Icon name={icon} />
                  {voteStr}
                </Table.Cell>
                <Table.Cell>
                { member.avatar_uri ?
                  <Image src={ member.avatar_uri } avatar floated="left" />
                  : <IdentityIcon className="image" value={member.root_account} size={40} /> }
                  { member.handle }
                </Table.Cell>
                {/*
                  TODO: Integrate:
                  <Table.Cell className="text-grey">{vote.createdAt}</Table.Cell>
                */}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </>
  );
}
