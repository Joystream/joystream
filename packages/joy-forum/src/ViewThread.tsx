import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table } from 'semantic-ui-react';

import { ThreadId } from './types';
import AddressMini from '@polkadot/ui-app/AddressMiniJoy';
import { useForum } from './Context';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { UrlHasIdProps } from './utils';

type ViewThreadProps = {
  id: ThreadId,
  preview?: boolean
};

export function ViewThread (props: ViewThreadProps) {
  const { state: {
    threadById,
    replyIdsByThreadId
  } } = useForum();

  const { id, preview = false } = props;
  const thread = threadById.get(id.toNumber());
  const replies = replyIdsByThreadId.get(id.toNumber()) || [];

  if (preview) {
    return !thread
      ? <></>
      : (
        <Table.Row>
          <Table.Cell>
            <Link to={`/forum/threads/${id.toString()}`}>{thread.title}</Link>
          </Table.Cell>
          <Table.Cell>
            {replies.length}
          </Table.Cell>
          <Table.Cell>
            {/* TODO show member instead of address */}
            <AddressMini value={thread.owner} isShort={false} isPadded={false} withBalance={true} withName={true} withMemo={true} size={36} />
          </Table.Cell>
        </Table.Row>
      );
  }

  if (!thread) {
    return <em>Thread not found</em>;
  }

  return (<>

    {/* TODO show bread crumbs to this thread */}

    <h1 style={{ display: 'flex' }}>
      {thread.title}
      <Link
        to={`/forum/threads/${id.toString()}/edit`}
        className='ui small button'
        style={{ marginLeft: '.5rem' }}
      >
        <i className='pencil alternate icon' />
        Edit
      </Link>
      <Link
        to={`/forum/threads/${id.toString()}/reply`}
        className='ui small button'
        style={{ marginLeft: '.5rem' }}
      >
        <i className='reply icon' />
        Reply
      </Link>
    </h1>
    <div>
      <MutedSpan>Author: </MutedSpan>
      {/* TODO show member instead of address */}
      <AddressMini value={thread.owner} isShort={false} isPadded={false} withBalance={true} withName={true} withMemo={true} size={36} />
    </div>
    <div style={{ marginTop: '1rem' }}>
      <ReactMarkdown className='JoyMemo--full' source={thread.text} linkTarget='_blank' />
    </div>

    {/* TODO list replies to this thread */}

  </>);
}

export function ViewThreadById (props: UrlHasIdProps) {
  const { match: { params: { id } } } = props;
  try {
    return <ViewThread id={new ThreadId(id)} />;
  } catch (err) {
    return <em>Invalid thread ID: {id}</em>;
  }
}
