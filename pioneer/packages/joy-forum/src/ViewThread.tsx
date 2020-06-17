import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { Table, Button, Label } from 'semantic-ui-react';
import BN from 'bn.js';

import { Category, Thread, ThreadId, Post, PostId } from '@joystream/types/forum';
import { Pagination, RepliesPerPage, CategoryCrumbs, TimeAgoDate, usePagination, useQueryParam } from './utils';
import { ViewReply } from './ViewReply';
import { Moderate } from './Moderate';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { JoyWarn } from '@polkadot/joy-utils/JoyStatus';
import { withForumCalls } from './calls';
import { withApi, withMulti } from '@polkadot/react-api';
import { ApiProps } from '@polkadot/react-api/types';
import { orderBy } from 'lodash';
import { bnToStr } from '@polkadot/joy-utils/index';
import { IfIAmForumSudo } from './ForumSudo';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';
import { formatDate } from '@polkadot/joy-utils/functions/date';

type ThreadTitleProps = {
  thread: Thread;
  className?: string;
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

const ThreadHeader = styled.div`
  margin: 1rem 0;

  h1 {
    margin: 0;
  }
`;

const ThreadInfoAndActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-top: .3rem;

  h1 {
    margin: 0;
  }
`;

const ThreadInfo = styled.span`
  display: inline-flex;
  align-items: center;

  font-size: .85rem;
  color: rgba(0, 0, 0, 0.5);
`;

const ThreadInfoMemberPreview = styled(MemberPreview)`
  && {
    margin: 0 .2rem;

    .PrefixLabel {
      color: inherit;
      margin-right: .2rem;
    }
  }
`;

type InnerViewThreadProps = {
  category: Category;
  thread: Thread;
  preview?: boolean;
};

type ViewThreadProps = ApiProps & InnerViewThreadProps & {
  nextPostId?: ThreadId;
};

function InnerViewThread (props: ViewThreadProps) {
  const [showModerateForm, setShowModerateForm] = useState(false);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const postsRefs = useRef<Record<number, React.RefObject<HTMLDivElement>>>({});
  const { category, thread, preview = false } = props;
  const [currentPage, setCurrentPage] = usePagination();
  const [rawSelectedPostIdx, setSelectedPostIdx] = useQueryParam('replyIdx');

  const parsedSelectedPostIdx = rawSelectedPostIdx ? parseInt(rawSelectedPostIdx) : null;
  const selectedPostIdx = (parsedSelectedPostIdx && !Number.isNaN(parsedSelectedPostIdx)) ? parsedSelectedPostIdx : null;

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

  const changePageAndClearSelectedPost = (page?: number | string) => {
    setSelectedPostIdx(null);
    setCurrentPage(page, true);
  };

  if (!category) {
    return <em>{'Thread\'s category was not found.'}</em>;
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
        <Table.Cell>
          {formatDate(thread.created_at.momentDate)}
        </Table.Cell>
      </Table.Row>
    );
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
        [x => x.nr_in_thread.toNumber()],
        ['asc']
      );

      // initialize refs for posts
      postsRefs.current = sortedPosts.reduce((acc, reply) => {
        const refKey = reply.nr_in_thread.toNumber();
        acc[refKey] = React.createRef();
        return acc;
      }, postsRefs.current);

      setPosts(sortedPosts);
      setLoaded(true);
    };

    loadPosts();
  }, [bnToStr(thread.id), bnToStr(nextPostId)]);

  // handle selected post
  useEffect(() => {
    if (!selectedPostIdx) return;

    const selectedPostPage = Math.ceil(selectedPostIdx / RepliesPerPage);
    if (currentPage !== selectedPostPage) {
      setCurrentPage(selectedPostPage);
    }

    if (!loaded) return;
    if (selectedPostIdx > posts.length) {
      // eslint-disable-next-line no-console
      console.warn(`Tried to open nonexistent reply with idx: ${selectedPostIdx}`);
      return;
    }

    const postRef = postsRefs.current[selectedPostIdx];

    // postpone scrolling for one render to make sure the ref is set
    setTimeout(() => {
      if (postRef.current) {
        postRef.current.scrollIntoView();
      } else {
        // eslint-disable-next-line no-console
        console.warn('Ref for selected post empty');
      }
    });
  }, [loaded, selectedPostIdx, currentPage]);

  // handle displayed posts based on pagination
  useEffect(() => {
    if (!loaded) return;
    const minIdx = (currentPage - 1) * RepliesPerPage;
    const maxIdx = minIdx + RepliesPerPage - 1;
    const postsToDisplay = posts.filter((_id, i) => i >= minIdx && i <= maxIdx);
    setDisplayedPosts(postsToDisplay);
  }, [loaded, posts, currentPage]);

  // console.log({ nextPostId: bnToStr(nextPostId), loaded, posts });

  const renderPageOfPosts = () => {
    if (!loaded) {
      return <em>Loading posts...</em>;
    }

    const pagination =
      <Pagination
        currentPage={currentPage}
        totalItems={totalPostsInThread}
        itemsPerPage={RepliesPerPage}
        onPageChange={changePageAndClearSelectedPost}
      />;

    const renderedReplies = displayedPosts.map((reply) => {
      const replyIdx = reply.nr_in_thread.toNumber();
      return (
        <ViewReply
          ref={postsRefs.current[replyIdx]}
          key={replyIdx}
          category={category}
          thread={thread}
          reply={reply}
          selected={selectedPostIdx === replyIdx}
        />
      );
    });

    return <>
      {pagination}
      {renderedReplies}
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
      <JoyWarn title={'This thread is moderated. Rationale:'}>
        <ReactMarkdown className='JoyMemo--full' source={thread.moderation.rationale} linkTarget='_blank' />
      </JoyWarn>
    </>;
  };

  return <div style={{ marginBottom: '1rem' }}>
    <CategoryCrumbs categoryId={thread.category_id} />
    <ThreadHeader>
      <h1 className='ForumPageTitle'>
        <ThreadTitle thread={thread} className='TitleText' />
      </h1>
      <ThreadInfoAndActions>
        <ThreadInfo>
          Created
          <ThreadInfoMemberPreview accountId={thread.author_id} inline prefixLabel="by" />
          <TimeAgoDate date={thread.created_at.momentDate} id="thread" />
        </ThreadInfo>
        {renderActions()}
      </ThreadInfoAndActions>
    </ThreadHeader>

    {category.archived &&
      <JoyWarn title={'This thread is in archived category.'}>
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

export const ViewThread = withMulti(
  InnerViewThread,
  withApi,
  withForumCalls<ViewThreadProps>(
    ['nextPostId', { propName: 'nextPostId' }]
  )
);

type ViewThreadByIdProps = ApiProps & {
  match: {
    params: {
      id: string;
    };
  };
};

function InnerViewThreadById (props: ViewThreadByIdProps) {
  const { api, match: { params: { id } } } = props;

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
  }, [id]);

  // console.log({ threadId: id, page });

  if (!loaded) {
    return <em>Loading thread details...</em>;
  }

  if (thread.isEmpty) {
    return <em>Thread was not found by id</em>;
  }

  if (category.isEmpty) {
    return <em>{ 'Thread\'s category was not found' }</em>;
  }

  return <ViewThread id={threadId} category={category} thread={thread} />;
}

export const ViewThreadById = withApi(InnerViewThreadById);
