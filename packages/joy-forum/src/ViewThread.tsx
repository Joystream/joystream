import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table, Button, Label } from 'semantic-ui-react';
import { History } from 'history';
import BN from 'bn.js';

import { Category, Thread, ThreadId, Post, PostId } from '@joystream/types/forum';
import { Pagination, RepliesPerPage, CategoryCrumbs } from './utils';
import { ViewReply } from './ViewReply';
import { Moderate } from './Moderate';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { JoyWarn } from '@polkadot/joy-utils/JoyWarn';
import { withForumCalls } from './calls';
import { withApi, withMulti } from '@polkadot/react-api';
import { ApiProps } from '@polkadot/react-api/types';
import { orderBy } from 'lodash';
import { bnToStr } from '@polkadot/joy-utils/';
import { IfIAmForumSudo } from './ForumSudo';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';

type ThreadTitleProps = {
  thread: Thread,
  className?: string
};

function ThreadTitle (props: ThreadTitleProps) {
  const { thread, className } = props;
  return <span className={className}>
    {/* {thread.pinned && <i
      className='star icon'
      title='This post is pinned by moderator'
      style={{ marginRight: '.5rem' }}
    />} */}
    {thread.title}
  </span>;
}

type InnerViewThreadProps = {
  category: Category,
  thread: Thread,
  page?: number,
  preview?: boolean,
  history?: History
};

type ViewThreadProps = ApiProps & InnerViewThreadProps & {
  nextPostId?: ThreadId
};

export const ViewThread = withMulti(
  InnerViewThread,
  withApi,
  withForumCalls<ViewThreadProps>(
    ['nextPostId', { propName: 'nextPostId' }]
  )
);

function InnerViewThread (props: ViewThreadProps) {
  const [showModerateForm, setShowModerateForm] = useState(false);
  const { history, category, thread, page = 1, preview = false } = props;

  if (!thread) {
    return <em>Loading thread details...</em>;
  }

  const renderThreadNotFound = () => (
    preview ? null : <em>Thread not found</em>
  );

  if (thread.isEmpty) {
    return renderThreadNotFound();
  }

  const { id } = thread;
  const totalPostsInThread = thread.num_posts_ever_created.toNumber();

  if (!category) {
    return <em>Thread's category was not found.</em>;
  } else if (category.deleted) {
    return renderThreadNotFound();
  }

  if (preview) {
    const title = <ThreadTitle thread={thread} />;
    const repliesCount = totalPostsInThread - 1;
    return (
      <Table.Row>
        <Table.Cell>
          <Link to={`/forum/threads/${id.toString()}`}>{thread.moderated
            ? <MutedSpan><Label color='orange'>Moderated</Label> {title}</MutedSpan>
            : title
          }</Link>
        </Table.Cell>
        <Table.Cell>
          {repliesCount}
        </Table.Cell>
        <Table.Cell>
          <MemberPreview accountId={thread.author_id} />
        </Table.Cell>
      </Table.Row>
    );
  }

  if (!history) {
    return <em>History propoerty is undefined</em>;
  }

  const { api, nextPostId } = props;
  const [loaded, setLoaded] = useState(false);
  const [posts, setPosts] = useState(new Array<Post>());

  useEffect(() => {
    const loadPosts = async () => {
      if (!nextPostId || totalPostsInThread === 0) return;

      const newId = (id: number | BN) => new PostId(id);
      const apiCalls: Promise<Post>[] = [];
      let id = newId(1);
      while (nextPostId.gt(id)) {
        apiCalls.push(api.query.forum.postById(id) as Promise<Post>);
        id = newId(id.add(newId(1)));
      }

      const allPosts = await Promise.all<Post>(apiCalls);
      const postsInThisThread = allPosts.filter(item =>
        !item.isEmpty &&
        item.thread_id.eq(thread.id)
      );
      const sortedPosts = orderBy(
        postsInThisThread,
        [ x => x.nr_in_thread.toNumber() ],
        [ 'asc' ]
      );

      setPosts(sortedPosts);
      setLoaded(true);
    };

    loadPosts();
  }, [ bnToStr(thread.id), bnToStr(nextPostId) ]);

  // console.log({ nextPostId: bnToStr(nextPostId), loaded, posts });

  const renderPageOfPosts = () => {
    if (!loaded) {
      return <em>Loading posts...</em>;
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
        totalItems={totalPostsInThread}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />;

    const pageOfItems = posts
      .filter((_id, i) => i >= minIdx && i <= maxIdx)
      .map((reply, i) => <ViewReply key={i} category={category} thread={thread} reply={reply} />);

    return <>
      {pagination}
      {pageOfItems}
      {pagination}
    </>;
  };

  const renderActions = () => {
    if (thread.moderated || category.archived || category.deleted) {
      return null;
    }
    return <span className='JoyInlineActions'>
      <Link
        to={`/forum/threads/${id.toString()}/reply`}
        className='ui small button'
      >
        <i className='reply icon' />
        Reply
      </Link>

      {/* TODO show 'Edit' button only if I am owner */}
      {/* <Link
        to={`/forum/threads/${id.toString()}/edit`}
        className='ui small button'
      >
        <i className='pencil alternate icon' />
        Edit
      </Link> */}

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

  const renderModerationRationale = () => {
    if (!thread.moderation) return null;

    return <>
      <JoyWarn title={`This thread is moderated. Rationale:`}>
        <ReactMarkdown className='JoyMemo--full' source={thread.moderation.rationale} linkTarget='_blank' />
      </JoyWarn>
    </>;
  };

  return <div style={{ marginBottom: '1rem' }}>
    <CategoryCrumbs categoryId={thread.category_id} />
    <h1 className='ForumPageTitle'>
      <ThreadTitle thread={thread} className='TitleText' />
      {renderActions()}
    </h1>
    {category.archived &&
      <JoyWarn title={`This thread is in archived category.`}>
        No new replies can be posted.
      </JoyWarn>
    }
    {showModerateForm &&
      <Moderate id={id} onCloseForm={() => setShowModerateForm(false)} />
    }
    {thread.moderated
      ? renderModerationRationale()
      : renderPageOfPosts()
    }
  </div>;
}

type ViewThreadByIdProps = ApiProps & {
  history: History,
  match: {
    params: {
      id: string
      page?: string
    }
  }
};

export const ViewThreadById = withApi(InnerViewThreadById);

function InnerViewThreadById (props: ViewThreadByIdProps) {
  const { api, history, match: { params: { id, page: pageStr } } } = props;

  let page = 1;
  if (pageStr) {
    try {
      // tslint:disable-next-line:radix
      page = parseInt(pageStr);
    } catch (err) {
      console.log('Failed to parse page number form URL');
    }
  }

  let threadId: ThreadId;
  try {
    threadId = new ThreadId(id);
  } catch (err) {
    console.log('Failed to parse thread id form URL');
    return <em>Invalid thread ID: {id}</em>;
  }

  const [loaded, setLoaded] = useState(false);
  const [thread, setThread] = useState(Thread.newEmpty());
  const [category, setCategory] = useState(Category.newEmpty());

  useEffect(() => {
    const loadThreadAndCategory = async () => {
      if (!threadId) return;

      const thread = await api.query.forum.threadById(threadId) as Thread;
      const category = await api.query.forum.categoryById(thread.category_id) as Category;

      setThread(thread);
      setCategory(category);
      setLoaded(true);
    };

    loadThreadAndCategory();
  }, [ id, page ]);

  // console.log({ threadId: id, page });

  if (!loaded) {
    return <em>Loading thread details...</em>;
  }

  if (thread.isEmpty) {
    return <em>Thread was not found by id</em>;
  }

  if (category.isEmpty) {
    return <em>Thread's category was not found</em>;
  }

  return <ViewThread id={threadId} category={category} thread={thread} page={page} history={history} />;
}
