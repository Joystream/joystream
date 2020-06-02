import React, { useState } from "react";
import { Button, Icon } from "semantic-ui-react";
import { ParsedPost } from '@polkadot/joy-utils/types/proposals';
import MemberProfilePreview from "@polkadot/joy-utils/MemberProfilePreview";
import DiscussionPostForm from './DiscussionPostForm';
import { MemberId } from "@joystream/types/members";
import { useTransport } from "@polkadot/joy-utils/react/hooks";
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

const StyledComment = styled.div`
  display: flex;
  margin-bottom: 1rem;
  @media screen and (max-width: 767px) {
    flex-direction: column;
  }
`;
const AuthorAndDate = styled.div`
  width: 250px;
  min-width: 250px;
  @media screen and (max-width: 767px) {
    width: 100%;
  }
`;
const Author = styled.div`
  margin-bottom: 0.5rem;
`;
const CreationDate = styled.div`
  color: rgba(0,0,0,.4);
`;
const ContentAndActions = styled.div`
  display: flex;
  flex-grow: 1;
`;
const CommentContent = styled.div`
  flex-grow: 1;
  padding: 0.5rem;
`;
const CommentActions = styled.div`
`;
const CommentAction = styled(Button)`
`;

type ProposalDiscussionPostProps = {
  post: ParsedPost;
  memberId?: MemberId;
  refreshDiscussion: () => void;
}

export default function DiscussionPost({
  post,
  memberId,
  refreshDiscussion
}: ProposalDiscussionPostProps) {
  const { author, authorId, text, createdAt, editsCount } = post;
  const [ editing, setEditing ] = useState(false);
  const constraints = useTransport().proposals.discussionContraints();
  const canEdit = (
    memberId &&
    post.postId &&
    authorId.toNumber() === memberId.toNumber() &&
    editsCount < constraints.maxPostEdits
  );
  const onEditSuccess = () => {
    setEditing(false);
    refreshDiscussion();
  };

  return (
    (memberId && editing) ? (
        <DiscussionPostForm
          memberId={memberId}
          threadId={post.threadId}
          post={post}
          onSuccess={onEditSuccess}
          constraints={constraints}/>
      ) : (
        <StyledComment>
          <AuthorAndDate>
            { author && (
              <Author>
                <MemberProfilePreview
                  avatar_uri={author.avatar_uri.toString()}
                  handle={author.handle.toString()}
                  root_account={author.root_account.toString()}/>
              </Author>
            ) }
            <CreationDate>
              <span>{ createdAt.toLocaleString() }</span>
            </CreationDate>
          </AuthorAndDate>
          <ContentAndActions>
            <CommentContent>
              <ReactMarkdown source={text} linkTarget='_blank' />
            </CommentContent>
            { canEdit && (
              <CommentActions>
                <CommentAction
                  onClick={() => setEditing(true)}
                  primary
                  size="tiny"
                  icon>
                  <Icon name="pencil" />
                </CommentAction>
              </CommentActions>
            ) }
          </ContentAndActions>
        </StyledComment>
      )
  )
}
