import React from 'react';
import { Divider, Header } from 'semantic-ui-react';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { ProposalId } from '@joystream/types/proposals';
import { ParsedDiscussion } from '@joystream/js/types/proposals';
import PromiseComponent from '@polkadot/joy-utils/react/components/PromiseComponent';
import DiscussionPost from './DiscussionPost';
import DiscussionPostForm from './DiscussionPostForm';
import { MemberId } from '@joystream/types/members';

type ProposalDiscussionProps = {
  proposalId: ProposalId;
  memberId?: MemberId;
  historical?: boolean;
};

export default function ProposalDiscussion ({
  proposalId,
  memberId,
  historical
}: ProposalDiscussionProps) {
  const transport = useTransport();
  const [discussion, error, loading, refreshDiscussion] = usePromise<ParsedDiscussion | null | undefined>(
    () => historical
      ? transport.proposals.historicalDiscussion(proposalId)
      : transport.proposals.discussion(proposalId),
    undefined,
    [historical]
  );
  const constraints = transport.proposals.discussionContraints();

  return (
    <PromiseComponent error={error} loading={loading} message={'Fetching discussion posts...'}>
      { discussion && (
        <>
          <Header as='h3'>Discussion ({ discussion.posts.length})</Header>
          <Divider />
          { discussion.posts.length ? (
            discussion.posts.map((post, key) => (
              <DiscussionPost
                key={post.postId ? post.postId.toNumber() : `k-${key}`}
                post={post}
                memberId={memberId}
                refreshDiscussion={refreshDiscussion}
                historical={historical}/>
            ))
          )
            : (
              <Header as='h4' style={{ margin: '1rem 0' }}>Nothing has been posted here yet!</Header>
            )
          }
          { (memberId && !historical) && (
            <DiscussionPostForm
              threadId={discussion.threadId}
              memberId={memberId}
              onSuccess={refreshDiscussion}
              constraints={constraints}/>
          ) }
        </>
      ) }
    </PromiseComponent>
  );
}
