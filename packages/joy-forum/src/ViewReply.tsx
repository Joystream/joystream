import React from 'react';
import ReactMarkdown from 'react-markdown';

import { ThreadId, ReplyId } from './types';
import { useForum } from './Context';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
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
    <div className='ui segment ReplyBox'>
      <div>
        <MutedSpan>Posted by </MutedSpan>
        <AuthorPreview address={reply.owner} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ReactMarkdown className='JoyMemo--full' source={reply.text} linkTarget='_blank' />
      </div>
    </div>
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
