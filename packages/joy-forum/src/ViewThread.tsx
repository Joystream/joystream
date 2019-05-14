import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table } from 'semantic-ui-react';

import { ThreadId, ReplyId } from './types';
import { useForum } from './Context';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { UrlHasIdProps, AuthorPreview } from './utils';
import Section from '@polkadot/joy-utils/Section';
import { ViewReply } from './ViewReply';

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
  const replyIds = replyIdsByThreadId.get(id.toNumber()) || [];

  if (preview) {
    return !thread
      ? <></>
      : (
        <Table.Row>
          <Table.Cell>
            <Link to={`/forum/threads/${id.toString()}`}>{thread.title}</Link>
          </Table.Cell>
          <Table.Cell>
            {replyIds.length}
          </Table.Cell>
          <Table.Cell>
            <AuthorPreview address={thread.owner} />
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
        to={`/forum/threads/${id.toString()}/reply`}
        className='ui small button'
        style={{ marginLeft: '.5rem' }}
      >
        <i className='reply icon' />
        Reply
      </Link>
      <Link
        to={`/forum/threads/${id.toString()}/edit`}
        className='ui small button'
        style={{ marginLeft: '.5rem' }}
      >
        <i className='pencil alternate icon' />
        Edit
      </Link>
    </h1>
    <div>
      <MutedSpan>Posted by </MutedSpan>
      <AuthorPreview address={thread.owner} />
    </div>
    <div style={{ marginTop: '1rem' }}>
      <ReactMarkdown className='JoyMemo--full' source={thread.text} linkTarget='_blank' />
    </div>

    <Section title='Replies'>
    {replyIds.length === 0
      ? <em>No replies in this thread yet</em>
      : replyIds.map((id, i) => (
        <ViewReply key={i} id={new ReplyId(id)} />
      ))
    }
    </Section>
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
