import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table, Segment, Button, Message, Label } from 'semantic-ui-react';
import { History } from 'history';

import { Thread, ThreadId, ReplyId } from './types';
import { useForum } from './Context';
import { UrlHasIdProps, AuthorPreview, Pagination, RepliesPerPage, CategoryCrumbs } from './utils';
import Section from '@polkadot/joy-utils/Section';
import { ViewReply } from './ViewReply';
import { Moderate } from './Moderate';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';

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

  const [showModerateForm, setShowModerateForm] = useState(false);
  const { history, id, page = 1, preview = false } = props;
  const thread = threadById.get(id.toNumber());

  if (!thread) {
    return preview ? null : <em>Thread not found</em>;
  }

  const isModerated = thread.moderation !== undefined;
  const replyIds = replyIdsByThreadId.get(id.toNumber()) || [];

  if (preview) {
    const titleLink = <ThreadTitle thread={thread} />;
    return (
      <Table.Row>
        <Table.Cell>
          <Link to={`/forum/threads/${id.toString()}`}>{isModerated
            ? <MutedSpan><Label color='orange'>Moderated</Label> {titleLink}</MutedSpan>
            : titleLink
          }</Link>
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

  if (!history) {
    return <em>Hisotry propoerty is undefined</em>;
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

  const renderThreadDetailsAndReplies = () => {
    return <>
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
  };

  const renderActions = () => {
    return <span className='ForumInlineActions'>
      <Link
        to={`/forum/threads/${id.toString()}/reply`}
        className='ui small button'
      >
        <i className='reply icon' />
        Reply
      </Link>

      {/* TODO show 'Edit' button only if I am owner */}
      <Link
        to={`/forum/threads/${id.toString()}/edit`}
        className='ui small button'
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

  const renderModerationRationale = () => {
    if (!thread.moderation) return null;

    return <>
      <Message warning className='JoyMainStatus'>
        <Message.Header>This thread is moderated. Rationale:</Message.Header>
        <ReactMarkdown className='JoyMemo--full' source={thread.moderation.rationale} linkTarget='_blank' />
      </Message>
    </>;
  };

  return <>
    <CategoryCrumbs categoryId={thread.category_id} />
    <h1 className='ForumPageTitle'>
      <ThreadTitle thread={thread} className='TitleText' />
      {!isModerated && renderActions()}
    </h1>
    {showModerateForm &&
      <Moderate id={id} onCloseForm={() => setShowModerateForm(false)} />
    }
    {isModerated
      ? renderModerationRationale()
      : renderThreadDetailsAndReplies()
    }
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
