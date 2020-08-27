import React from 'react';
import { Header, Divider, Table, Icon } from 'semantic-ui-react';
import useVoteStyles from './useVoteStyles';
import { VoteKind } from '@joystream/types/proposals';
import { VoteKindStr } from './VotingSection';
import ProfilePreview from '@polkadot/joy-utils/MemberProfilePreview';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { ParsedProposal, ProposalVotes } from '@polkadot/joy-utils/types/proposals';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';

type VotesProps = {
  proposal: ParsedProposal;
};

export default function Votes ({ proposal: { id, votingResults } }: VotesProps) {
  const transport = useTransport();
  const [votes, error, loading] = usePromise<ProposalVotes | null>(
    () => transport.proposals.votes(id),
    null,
    [votingResults]
  );

  return (
    <PromiseComponent
      error={error}
      loading={loading}
      message="Fetching the votes...">
      { (votes && votes.votes.length > 0)
        ? (
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
        )
        : (
          <Header as="h4">No votes have been submitted!</Header>
        )
      }
    </PromiseComponent>
  );
}
