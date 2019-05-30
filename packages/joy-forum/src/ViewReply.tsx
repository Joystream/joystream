import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Segment, Button } from 'semantic-ui-react';

import { ReplyId, Category, Thread } from './types';
import { useForum } from './Context';
import { UrlHasIdProps, AuthorPreview } from './utils';
import { Moderate } from './Moderate';
import { JoyWarn } from '@polkadot/joy-utils/JoyWarn';

type ViewReplyProps = {
  id: ReplyId,
  thread: Thread,
  category: Category
};

export function ViewReply (props: ViewReplyProps) {
  const { state: {
    replyById
  }} = useForum();

  const [showModerateForm, setShowModerateForm] = useState(false);
  const { id, thread, category } = props;
  const reply = replyById.get(id.toNumber());

  if (!reply) {
    return <em>Reply not found</em>;
  }

  const renderReplyDetails = () => {
    return <ReactMarkdown className='JoyMemo--full' source={reply.text} linkTarget='_blank' />;
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
        <AuthorPreview address={reply.owner} />
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

export function ViewReplyById (props: UrlHasIdProps) {
  const { match: { params: { id } } } = props;

  const { state: {
    categoryById,
    threadById,
    replyById
  }} = useForum();

  let replyId: ReplyId | undefined;
  try {
    replyId = new ReplyId(id);
  } catch (err) {
    console.log('Invalid reply ID', id);
  }

  if (!replyId) {
    return <em>Invalid reply ID: {id}</em>;
  }

  const reply = replyById.get(replyId.toNumber());
  if (!reply) {
    return <em>Reply was not found.</em>;
  }

  const thread = threadById.get(reply.thread_id.toNumber());
  if (!thread) {
    return <em>Reply's thread was not found.</em>;
  }

  const category = categoryById.get(thread.category_id.toNumber());
  if (!category) {
    return <em>Reply's category was not found.</em>;
  }

  return <ViewReply id={replyId} thread={thread} category={category} />;
}
