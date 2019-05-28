import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Segment, Button, Message } from 'semantic-ui-react';

import { ReplyId } from './types';
import { useForum } from './Context';
import { UrlHasIdProps, AuthorPreview } from './utils';
import { Moderate } from './Moderate';

type ViewReplyProps = {
  id: ReplyId
};

export function ViewReply (props: ViewReplyProps) {
  const { state: {
    replyById
  } } = useForum();

  const [showModerateForm, setShowModerateForm] = useState(false);
  const { id } = props;
  const reply = replyById.get(id.toNumber());

  if (!reply) {
    return <em>Reply not found</em>;
  }

  const isModerated = reply.moderation !== undefined;

  const renderReplyDetails = () => {
    return <ReactMarkdown className='JoyMemo--full' source={reply.text} linkTarget='_blank' />;
  };

  const renderModerationRationale = () => {
    if (!reply.moderation) return null;

    return <>
      <Message warning className='JoyMainStatus'>
        <Message.Header>This reply is moderated. Rationale:</Message.Header>
        <ReactMarkdown className='JoyMemo--full' source={reply.moderation.rationale} linkTarget='_blank' />
      </Message>
    </>;
  };

  const renderActions = () => {
    return <>
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
    </>;
  };

  return (
    <Segment>
      <div>
        <AuthorPreview address={reply.owner} />
        {!isModerated && renderActions()}
      </div>
      <div style={{ marginTop: '1rem' }}>
        {showModerateForm &&
          <Moderate id={id} onCloseForm={() => setShowModerateForm(false)} />
        }
        {isModerated
          ? renderModerationRationale()
          : renderReplyDetails()
        }
      </div>
    </Segment>
  );
}

export function ViewReplyById (props: UrlHasIdProps) {
  const { match: { params: { id } } } = props;
  try {
    return <ViewReply id={new ReplyId(id)} />;
  } catch (err) {
    return <em>Invalid reply ID: {id}</em>;
  }
}
