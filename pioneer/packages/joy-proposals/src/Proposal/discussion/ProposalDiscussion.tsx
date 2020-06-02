import React from "react";
import { Divider, Header } from "semantic-ui-react";
import { useTransport, usePromise } from "@polkadot/joy-utils/react/hooks";
import { ProposalId } from '@joystream/types/proposals';
import { ParsedDiscussion} from '@polkadot/joy-utils/types/proposals'
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import DiscussionPost from './DiscussionPost';
import DiscussionPostForm from './DiscussionPostForm';
import { MemberId } from "@joystream/types/members";

type ProposalDiscussionProps = {
  proposalId: ProposalId;
  memberId?: MemberId;
};

export default function ProposalDiscussion({
  proposalId,
  memberId
}: ProposalDiscussionProps) {
  const transport = useTransport();
  const [discussion, error, loading, refreshDiscussion] = usePromise<ParsedDiscussion | null | undefined>(
    () => transport.proposals.discussion(proposalId),
    undefined
  );
  const constraints = transport.proposals.discussionContraints();

  return (
    <PromiseComponent error={error} loading={loading} message={'Fetching discussion posts...'}>
      { discussion && (
        <>
          <Header as="h3">Discussion ({ discussion.posts.length})</Header>
          <Divider />
          { discussion.posts.length ? (
              discussion.posts.map((post, key) => (
                <DiscussionPost
                  key={post.postId ? post.postId.toNumber() : `k-${key}`}
                  post={post}
                  memberId={memberId}
                  refreshDiscussion={refreshDiscussion}/>
              ))
            )
            : (
              <Header as="h4" style={{ margin: '1rem 0'}}>Nothing has been posted here yet!</Header>
            )
          }
          { memberId && (
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
