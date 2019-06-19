import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Segment, Button } from 'semantic-ui-react';

import { Post, Category, Thread } from '@joystream/types/forum';
import { AuthorPreview } from './utils';
import { Moderate } from './Moderate';
import { JoyWarn } from '@polkadot/joy-utils/JoyWarn';

type ViewReplyProps = {
  reply: Post,
  thread: Thread,
  category: Category
};

export function ViewReply (props: ViewReplyProps) {
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
    return <span className='JoyInlineActions'>
      {/* TODO show 'Edit' button only if I am owner */}
      <Link
        to={`/forum/replies/${id.toString()}/edit`}
        className='ui small button'
        style={{ marginLeft: '.5rem' }}
      >
        <i className='pencil alternate icon' />
        Edit
      </Link>

      {/* TODO show 'Moderate' button only if current user is a forum sudo */}
      <Button
        type='button'
        size='small'
        content={'Moderate'}
        onClick={() => setShowModerateForm(!showModerateForm)}
      />
    </span>;
  };

  return (
    <Segment>
      <div>
        <AuthorPreview address={reply.author_id} />
        {renderActions()}
      </div>
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
