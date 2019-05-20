import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table, Segment } from 'semantic-ui-react';
import { History } from 'history';

import { Thread, ThreadId, ReplyId } from './types';
import { useForum } from './Context';
import { UrlHasIdProps, AuthorPreview, Pagination, RepliesPerPage, CategoryCrumbs } from './utils';
import Section from '@polkadot/joy-utils/Section';
import { ViewReply } from './ViewReply';

type ThreadTitleProps = {
  thread: Thread,
  className?: string
};

function ThreadTitle (props: ThreadTitleProps) {
  const { thread, className } = props;
  return <span className={className}>
    {thread.pinned && <i
      className='star icon'
      title='This post is pinned by moderator'
      style={{ marginRight: '.5rem' }}
    />}
    {thread.title}
  </span>;
}

type ViewThreadProps = {
  id: ThreadId,
  page?: number,
  preview?: boolean,
  history?: History
};

export function ViewThread (props: ViewThreadProps) {
  const { state: {
    threadById,
    replyIdsByThreadId
  } } = useForum();

  const { history, id, page = 1, preview = false } = props;
  const thread = threadById.get(id.toNumber());
  const replyIds = replyIdsByThreadId.get(id.toNumber()) || [];

  if (preview) {
    return !thread
      ? <></>
      : (
        <Table.Row>
          <Table.Cell>
            <Link to={`/forum/threads/${id.toString()}`}>
              <ThreadTitle thread={thread} />
            </Link>
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

  if (!thread || !history) {
    return <em>Thread not found</em>;
  }

  const renderPageOfReplies = () => {
    if (!replyIds.length) {
      return <em>No replies in this thread yet</em>;
    }

    const onPageChange = (activePage?: string | number) => {
      history.push(`/forum/threads/${id.toString()}/page/${activePage}`);
    };

    const itemsPerPage = RepliesPerPage;
    const minIdx = (page - 1) * RepliesPerPage;
    const maxIdx = minIdx + RepliesPerPage - 1;

    const pagination =
      <Pagination
        currentPage={page}
        totalItems={replyIds.length}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />;

    const pageOfItems = replyIds
      .filter((_id, i) => i >= minIdx && i <= maxIdx)
      .map((id, i) => <ViewReply key={i} id={new ReplyId(id)} />);

    return <>
      {pagination}
      {pageOfItems}
      {pagination}
    </>;
  };

  return <>
    <CategoryCrumbs categoryId={thread.category_id} />
    <h1 className='ForumPageTitle'>
      <ThreadTitle thread={thread} className='TitleText' />
      <Link
        to={`/forum/threads/${id.toString()}/reply`}
        className='ui small button'
        style={{ marginLeft: '.5rem' }}
      >
        <i className='reply icon' />
        Reply
      </Link>

      {/* TODO show 'Edit' button only if I am owner */}
      <Link
        to={`/forum/threads/${id.toString()}/edit`}
        className='ui small button'
        style={{ marginLeft: '.5rem' }}
      >
        <i className='pencil alternate icon' />
        Edit
      </Link>
    </h1>
    <Segment>
      <div>
        <AuthorPreview address={thread.owner} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ReactMarkdown className='JoyMemo--full' source={thread.text} linkTarget='_blank' />
      </div>
    </Segment>
    <Section title={`Replies (${replyIds.length})`}>
      {renderPageOfReplies()}
    </Section>
  </>;
}

type ViewThreadByIdProps = UrlHasIdProps & {
  history: History,
  match: {
    params: {
      id: string
      page?: string
    }
  }
};

export function ViewThreadById (props: ViewThreadByIdProps) {
  const { history, match: { params: { id, page: pageStr } } } = props;
  try {
    // tslint:disable-next-line:radix
    const page = pageStr ? parseInt(pageStr) : 1;
    return <ViewThread id={new ThreadId(id)} page={page} history={history} />;
  } catch (err) {
    return <em>Invalid thread ID: {id}</em>;
  }
}
