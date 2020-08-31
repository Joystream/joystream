import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Button, Icon } from 'semantic-ui-react';

import { Post, Category, Thread } from '@joystream/types/forum';
import { Moderate } from './Moderate';
import { JoyWarn } from '@polkadot/joy-utils/JoyStatus';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { IfIAmForumSudo } from './ForumSudo';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';
import { TimeAgoDate, ReplyIdxQueryParam } from './utils';

const HORIZONTAL_PADDING = '1em';
const ReplyMarkdown = styled(ReactMarkdown)`
  font-size: 1.15rem;

  blockquote {
    color: rgba(78, 78, 78, 0.6);
    margin-left: 15px;
    padding-left: 15px;
    border-left: 2px solid rgba(78, 78, 78, 0.6);
  }
`;
const ReplyContainer = styled.div<{ selected?: boolean }>`
  && {
    padding: 0;

    outline: ${({ selected }) => selected ? '2px solid #ffc87b' : 'none'};
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
  padding: 0.35em ${HORIZONTAL_PADDING};
`;
const ReplyFooterActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

type ViewReplyProps = {
  reply: Post;
  thread: Thread;
  category: Category;
  selected?: boolean;
  onEdit: () => void;
  onQuote: () => void;
};

// eslint-disable-next-line react/display-name
export const ViewReply = React.forwardRef((props: ViewReplyProps, ref: React.Ref<HTMLDivElement>) => {
  const { state: { address: myAddress } } = useMyAccount();
  const [showModerateForm, setShowModerateForm] = useState(false);
  const { pathname, search } = useLocation();
  const { reply, thread, category, selected = false, onEdit, onQuote } = props;
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
          <Button onClick={onEdit} size="mini">
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
      <Button onClick={onQuote} size="mini">
        <Icon name="quote left" />
        Quote
      </Button>
    </ReplyFooterActionsRow>;
  };

  const replyLinkSearch = new URLSearchParams(search);
  replyLinkSearch.set(ReplyIdxQueryParam, reply.nr_in_thread.toString());

  return (
    <ReplyContainer className="ui segment" ref={ref} selected={selected}>
      <ReplyHeader>
        <ReplyHeaderAuthorRow>
          <MemberPreview accountId={reply.author_id} />
        </ReplyHeaderAuthorRow>
        <ReplyHeaderDetailsRow>
          <TimeAgoDate date={reply.created_at.momentDate} id={reply.id} />
          <Link to={{ pathname, search: replyLinkSearch.toString() }}>
            #{reply.nr_in_thread.toNumber()}
          </Link>
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
});
