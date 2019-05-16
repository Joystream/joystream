import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Segment } from 'semantic-ui-react';

import { ThreadId, ReplyId } from './types';
import { useForum } from './Context';
import { UrlHasIdProps, AuthorPreview } from './utils';

type ViewReplyProps = {
  id: ThreadId
};

export function ViewReply (props: ViewReplyProps) {
  const { state: {
    replyById
  } } = useForum();

  const { id } = props;
  const reply = replyById.get(id.toNumber());

  if (!reply) {
    return <em>Reply not found</em>;
  }

  return (
    <Segment>
      <div>
        <AuthorPreview address={reply.owner} />

        {/* TODO show 'Edit' button only if I am owner */}
        <Link
          to={`/forum/replies/${id.toString()}/edit`}
          className='ui small button'
          style={{ marginLeft: '.5rem' }}
        >
          <i className='pencil alternate icon' />
          Edit
        </Link>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ReactMarkdown className='JoyMemo--full' source={reply.text} linkTarget='_blank' />
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
