import React from "react";
import { Header, Divider, Table, Icon } from "semantic-ui-react";
import useVoteStyles from "./useVoteStyles";
import { useTransport, ProposalVote } from "../runtime";
import { ProposalId, VoteKind } from "@joystream/types/proposals";
import { VoteKindStr } from "./VotingSection";
import { usePromise } from "../utils";
import Loading from "./Loading";
import Error from "./Error";
import ProfilePreview from "./ProfilePreview";

type VotesProps = {
  proposalId: ProposalId;
};

export default function Votes({ proposalId }: VotesProps) {
  const transport = useTransport();
  const [votes, loading, error] = usePromise<ProposalVote[]>(() => transport.votes(proposalId), []);

  if (loading && !error) {
    return <Loading text="Fetching the votes..." />;
  } else if (error) {
    return <Error error={error} />;
  }

  const nonEmptyVotes = votes.filter(proposalVote => proposalVote.vote !== null);

  if (!nonEmptyVotes.length) {
    return <Header as="h3">No votes submitted yet!</Header>;
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
