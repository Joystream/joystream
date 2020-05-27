import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Segment, Button } from 'semantic-ui-react';

import { Post, Category, Thread } from '@joystream/types/forum';
import { Moderate } from './Moderate';
import { JoyWarn } from '@polkadot/joy-utils/JoyStatus';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { IfIAmForumSudo } from './ForumSudo';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';
import { FlexCenter } from '@polkadot/joy-utils/FlexCenter';

type ViewReplyProps = {
  reply: Post,
  thread: Thread,
  category: Category
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
    return <ReactMarkdown className='JoyMemo--full' source={reply.current_text} linkTarget='_blank' />;
  };

  const renderModerationRationale = () => {
    if (!reply.moderation) return null;

    return <>
      <JoyWarn title={`This reply is moderated. Rationale:`}>
        <ReactMarkdown className='JoyMemo--full' source={reply.moderation.rationale} linkTarget='_blank' />
      </JoyWarn>
    </>;
  };

  const renderActions = () => {
    if (reply.moderated || thread.moderated || category.archived || category.deleted) {
      return null;
    }
    const isMyPost = reply.author_id.eq(myAddress);
    return <span className='JoyInlineActions' style={{ marginLeft: '.5rem' }}>
      {isMyPost &&
        <Link
          to={`/forum/replies/${id.toString()}/edit`}
          className='ui small button'
        >
          <i className='pencil alternate icon' />
          Edit
        </Link>
      }

      <IfIAmForumSudo>
        <Button
          type='button'
          size='small'
          content={'Moderate'}
          onClick={() => setShowModerateForm(!showModerateForm)}
        />
      </IfIAmForumSudo>
    </span>;
  };

  return (
    <Segment>
      <FlexCenter>
        <MemberPreview accountId={reply.author_id} />
        {renderActions()}
      </FlexCenter>
      <div style={{ marginTop: '1rem' }}>
        {showModerateForm &&
          <Moderate id={id} onCloseForm={() => setShowModerateForm(false)} />
        }
        {reply.moderated
          ? renderModerationRationale()
          : renderReplyDetails()
        }
      </div>
    </Segment>
  );
}
