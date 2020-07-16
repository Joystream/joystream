import React from 'react';
import { Header, Divider, Table, Icon } from 'semantic-ui-react';
import useVoteStyles from './useVoteStyles';
import { ProposalVotes } from '@polkadot/joy-utils/types/proposals';
import { VoteKind } from '@joystream/types/proposals';
import { VoteKindStr } from './VotingSection';
import ProfilePreview from '@polkadot/joy-utils/MemberProfilePreview';

type VotesProps = {
  votes: ProposalVotes;
};

export default function Votes ({ votes }: VotesProps) {
  if (!votes.votes.length) {
    return <Header as="h4">No votes have been submitted!</Header>;
  }

  return (
    <>
      <Header as="h3">
        All Votes: ({votes.votes.length}/{votes.councilMembersLength})
      </Header>
      <Divider />
      <Table basic="very">
        <Table.Body>
          {votes.votes.map((proposalVote, idx) => {
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
                  <ProfilePreview
                    handle={member.handle}
                    avatar_uri={member.avatar_uri}
                    root_account={member.root_account}
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </>
  );
}
