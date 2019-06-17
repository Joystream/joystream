import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table, Segment, Button, Label } from 'semantic-ui-react';
import { History } from 'history';
import BN from 'bn.js';

import { Category, Thread, ThreadId, Post, PostId } from './types';
import { AuthorPreview, Pagination, RepliesPerPage, CategoryCrumbs, UrlHasIdProps } from './utils';
import Section from '@polkadot/joy-utils/Section';
import { ViewReply } from './ViewReply';
import { Moderate } from './Moderate';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { JoyWarn } from '@polkadot/joy-utils/JoyWarn';
import { withForumCalls } from './calls';
import { withApi, withMulti, api } from '@polkadot/ui-api';
import { ApiProps } from '@polkadot/ui-api/types';
import { orderBy } from 'lodash';
import { bnToStr } from '@polkadot/joy-utils/';

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

  // We substract 1 from num of posts because the first post is not a reply,
  // it's an initial text (body) on the thread.
  const replyCount = totalPostsInThread - 1;

  if (!category) {
    return <em>Thread's category was not found.</em>;
  } else if (category.deleted) {
    return renderThreadNotFound();
  }

  if (preview) {
    const title = <ThreadTitle thread={thread} />;
    return (
      <Table.Row>
        <Table.Cell>
          <Link to={`/forum/threads/${id.toString()}`}>{thread.moderated
            ? <MutedSpan><Label color='orange'>Moderated</Label> {title}</MutedSpan>
            : title
          }</Link>
        </Table.Cell>
        <Table.Cell>
          {replyCount}
        </Table.Cell>
        <Table.Cell>
          <AuthorPreview address={thread.author_id} />
        </Table.Cell>
      </Table.Row>
    );
  }

  if (!history) {
    return <em>History propoerty is undefined</em>;
  }

  const { nextPostId } = props;
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

  const [ firstPost, ...replies ] = posts;
  const threadBody = firstPost ? firstPost.current_text : '';

  const renderPageOfReplies = () => {
    if (!replyCount) {
      return <em>No replies in this thread yet</em>;
    }

    if (!loaded) {
      return <em>Loading post's replies...</em>;
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
        totalItems={replyCount}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />;

    const pageOfItems = replies
      .filter((_id, i) => i >= minIdx && i <= maxIdx)
      .map((reply, i) => <ViewReply key={i} category={category} thread={thread} reply={reply} />);

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
          <AuthorPreview address={thread.author_id} />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <ReactMarkdown className='JoyMemo--full' source={threadBody} linkTarget='_blank' />
        </div>
      </Segment>
      <Section title={`Replies (${replyCount})`}>
        {renderPageOfReplies()}
      </Section>
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
      <JoyWarn title={`This thread is moderated. Rationale:`}>
        <ReactMarkdown className='JoyMemo--full' source={thread.moderation.rationale} linkTarget='_blank' />
      </JoyWarn>
    </>;
  };

  return <>
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
