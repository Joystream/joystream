import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Tooltip from 'react-tooltip';
import { Segment, Button, Icon } from 'semantic-ui-react';

import { Post, Category, Thread } from '@joystream/types/forum';
import { Moderate } from './Moderate';
import { JoyWarn } from '@polkadot/joy-utils/JoyStatus';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { IfIAmForumSudo } from './ForumSudo';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';

const HORIZONTAL_PADDING = '1em';
const ReplyMarkdown = styled(ReactMarkdown)`
  font-size: 1.15rem;
`;
const ReplyContainer = styled(Segment)`
  && {
    padding: 0;
  }
  overflow: hidden;
`;
const ReplyHeader = styled.div`
  background-color: #fafcfc;
`;
const ReplyHeaderAuthorRow = styled.div`
  padding: 0.7em ${HORIZONTAL_PADDING};
`;
const ReplyHeaderDetailsRow = styled.div`
  padding: 0.5em ${HORIZONTAL_PADDING};
  border-top: 1px dashed rgba(34, 36, 38, .15);
  border-bottom: 1px solid rgba(34, 36, 38, .15);
  display: flex;
  justify-content: space-between;
`;
const ReplyContent = styled.div`
  padding: 1em ${HORIZONTAL_PADDING};
`;
const ReplyFooter = styled.div`
  border-top: 1px solid rgba(34, 36, 38, .15);
  background-color: #fafcfc;
  padding: 0.5em ${HORIZONTAL_PADDING};
`;
const ReplyFooterActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

type ViewReplyProps = {
  reply: Post;
  thread: Thread;
  category: Category;
};

export function ViewReply (props: ViewReplyProps) {
  const { state: { address: myAddress } } = useMyAccount();
  const [showModerateForm, setShowModerateForm] = useState(false);
  const { reply, thread, category } = props;
  const { id } = reply;

  if (reply.isEmpty) {
    return <em>Reply not found</em>;
  }

  const renderReplyDetails = () => {
    return <ReplyMarkdown className='JoyMemo--full' source={reply.current_text} linkTarget='_blank' />;
  };

  const renderModerationRationale = () => {
    if (!reply.moderation) return null;

    return <>
      <JoyWarn title={'This reply is moderated. Rationale:'}>
        <ReactMarkdown className='JoyMemo--full' source={reply.moderation.rationale} linkTarget='_blank' />
      </JoyWarn>
    </>;
  };

  const renderActions = () => {
    if (reply.moderated || thread.moderated || category.archived || category.deleted) {
      return null;
    }
    const isMyPost = reply.author_id.eq(myAddress);
    return <ReplyFooterActionsRow>
      <div>
        {isMyPost &&
          <Button as={Link} to={`/forum/replies/${id.toString()}/edit`} size="mini">
            <Icon name="pencil" />
            Edit
          </Button>
        }

        <IfIAmForumSudo>
          <Button
            size="mini"
            onClick={() => setShowModerateForm(!showModerateForm)}
          >
            Moderate
          </Button>
        </IfIAmForumSudo>
      </div>
      <Button size="mini">
        <Icon name="quote left" />
        Quote
      </Button>
    </ReplyFooterActionsRow>;
  };

  const replyDate = reply.created_at.momentDate;

  return (
    <ReplyContainer>
      <ReplyHeader>
        <ReplyHeaderAuthorRow>
          <MemberPreview accountId={reply.author_id} />
        </ReplyHeaderAuthorRow>
        <ReplyHeaderDetailsRow>
          <span data-tip data-for="reply-full-date">
            {replyDate.fromNow()}
          </span>
          <Tooltip id="reply-full-date" place="top" effect="solid">
            {replyDate.toLocaleString()}
          </Tooltip>
          <a>
            #{reply.nr_in_thread.toNumber()}
          </a>
        </ReplyHeaderDetailsRow>
      </ReplyHeader>

      <ReplyContent>
        {reply.moderated
          ? renderModerationRationale()
          : renderReplyDetails()
        }
      </ReplyContent>

      <ReplyFooter>
        {renderActions()}
        {showModerateForm &&
          <Moderate id={id} onCloseForm={() => setShowModerateForm(false)} />
        }
      </ReplyFooter>
    </ReplyContainer>
  );
}
