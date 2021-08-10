import React, { useState, useEffect, useRef } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { Table, Button, Label, Icon } from 'semantic-ui-react';
import BN from 'bn.js';

import { PostId, ThreadId } from '@joystream/types/common';
import { Category, Thread, Post } from '@joystream/types/forum';
import { Pagination, RepliesPerPage, CategoryCrumbs, TimeAgoDate, usePagination, useQueryParam, ReplyIdxQueryParam, ReplyEditIdQueryParam } from './utils';
import { ViewReply } from './ViewReply';
import { Moderate } from './Moderate';
import { MutedSpan, JoyWarn } from '@polkadot/joy-utils/react/components';

import { withForumCalls } from './calls';
import { withApi, withMulti } from '@polkadot/react-api';
import { ApiProps } from '@polkadot/react-api/types';
import { orderBy } from 'lodash';
import { bnToStr } from '@polkadot/joy-utils/functions/misc';
import { IfIAmForumSudo } from './ForumSudo';
import MemberPreview from '@polkadot/joy-utils/react/components/MemberByAccountPreview';
import { formatDate } from '@polkadot/joy-utils/functions/date';
import { NewReply, EditReply } from './EditReply';
import { useApi } from '@polkadot/react-hooks';
import { ApiPromise } from '@polkadot/api/promise';

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
  margin: 0 .5rem;
`;

const ReplyEditContainer = styled.div`
  margin-top: 30px;
  padding-bottom: 60px;
`;

type ThreadPreviewProps = {
  thread: Thread;
  repliesCount: number;
}

const ThreadPreview: React.FC<ThreadPreviewProps> = ({ thread, repliesCount }) => {
  const title = <ThreadTitle thread={thread} />;

  return (
    <Table.Row>
      <Table.Cell>
        <Link to={`/forum/threads/${thread.id.toString()}`}>
          {
            thread.moderated
              ? (
                <MutedSpan>
                  <Label color='orange'>Moderated</Label> {title}
                </MutedSpan>
              )
              : title
          }
        </Link>
      </Table.Cell>
      <Table.Cell>
        {repliesCount}
      </Table.Cell>
      <Table.Cell>
        <MemberPreview accountId={thread.author_id} showCouncilBadge showId={false}/>
      </Table.Cell>
      <Table.Cell>
        {formatDate(thread.created_at.momentDate)}
      </Table.Cell>
    </Table.Row>
  );
};

type InnerViewThreadProps = {
  category: Category;
  thread: Thread;
  preview?: boolean;
};

type ViewThreadProps = ApiProps & InnerViewThreadProps & {
  nextPostId?: ThreadId;
};

const POSTS_THREAD_MAP_CACHE_KEY = 'postsThreadMap';

async function refreshPostsInThreadCache (nextPostId: PostId, api: ApiPromise) {
  const newId = (id: number | BN) => api.createType('PostId', id);
  const apiCalls: Promise<Post>[] = [];
  let id = newId(1);

  let mapPostToThread = getPostsIdsInThreadCache();
  const nextTreadId = await api.query.forum.nextThreadId() as ThreadId;

  if (mapPostToThread.size >= Number(nextTreadId.toString())) { // invalid cache
    mapPostToThread = new Map<number, number[]>();
  }

  if (mapPostToThread.size > 0) {
    let lastPostIdInCache = 0;

    for (const postIds of mapPostToThread.values()) {
      const maxPostIdInThread = postIds.reduce((a, b) => a > b ? a : b);

      if (maxPostIdInThread > lastPostIdInCache) {
        lastPostIdInCache = maxPostIdInThread;
      }
    }

    id = newId(lastPostIdInCache);
    const lastPost = await api.query.forum.postById(lastPostIdInCache) as Post;

    if (lastPost) {
      const postsInThread = mapPostToThread.get(Number(lastPost.thread_id.toString()));

      if (!postsInThread || !postsInThread.includes(lastPostIdInCache)) { // cache doesn't match the data in chain
        mapPostToThread = new Map<number, number[]>();
      }
    } else {
      mapPostToThread = new Map<number, number[]>();
    }
  }

  while (nextPostId.gt(id)) {
    apiCalls.push(api.query.forum.postById(id) as Promise<Post>);
    id = newId(id.add(newId(1)));
  }

  const newPosts = await Promise.all<Post>(apiCalls);

  for (const post of newPosts) {
    let posts = mapPostToThread.get(Number(post.thread_id.toString())) as number[];
    const postId = Number(post.id.toString());

    if (!posts) {
      posts = [postId];
    } else if (!posts.includes(postId)) {
      posts.push(postId);
    }

    mapPostToThread.set(Number(post.thread_id.toString()), posts);
  }

  localStorage.setItem(POSTS_THREAD_MAP_CACHE_KEY, JSON.stringify([...mapPostToThread]));
}

function getPostsIdsInThreadCache (): Map<number, number[]> {
  const serializedMap = localStorage.getItem(POSTS_THREAD_MAP_CACHE_KEY);

  if (!serializedMap) {
    return new Map<number, number[]>();
  }

  return new Map<number, number[]>(JSON.parse(serializedMap));
}

function InnerViewThread (props: ViewThreadProps) {
  const [showModerateForm, setShowModerateForm] = useState(false);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);

  const postsRefs = useRef<Record<number, React.RefObject<HTMLDivElement>>>({});
  const replyFormRef = useRef<HTMLDivElement>(null);

  const [rawSelectedPostIdx, setSelectedPostIdx] = useQueryParam(ReplyIdxQueryParam);
  const [rawEditedPostId, setEditedPostId] = useQueryParam(ReplyEditIdQueryParam);
  const [currentPage, setCurrentPage] = usePagination();

  const parsedSelectedPostIdx = rawSelectedPostIdx ? parseInt(rawSelectedPostIdx) : null;
  const selectedPostIdx = (parsedSelectedPostIdx && !Number.isNaN(parsedSelectedPostIdx)) ? parsedSelectedPostIdx : null;

  const { category, thread, preview = false, api, nextPostId } = props;

  const editedPostId = rawEditedPostId && api.createType('PostId', rawEditedPostId);

  const { id } = thread;
  const totalPostsInThread = thread.num_posts_ever_created.toNumber();

  const [loaded, setLoaded] = useState(false);
  const [posts, setPosts] = useState(new Array<Post>());

  // fetch posts
  useEffect(() => {
    const loadPosts = async () => {
      if (!nextPostId || totalPostsInThread === 0 || thread.isEmpty) return;

      await refreshPostsInThreadCache(nextPostId, api);
      const mapPostToThread = getPostsIdsInThreadCache();

      const postIdsInThread = mapPostToThread.get(Number(thread.id.toString())) as number[];
      const postsInThisThreadCalls: Promise<Post>[] = [];

      for (const postId of postIdsInThread) {
        postsInThisThreadCalls.push(api.query.forum.postById(postId) as Promise<Post>);
      }

      const postsInThisThread = await Promise.all(postsInThisThreadCalls);

      const sortedPosts = orderBy(
        postsInThisThread,
        [(x) => x.nr_in_thread.toNumber()],
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

    void loadPosts();
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

  const renderThreadNotFound = () => (
    preview ? null : <em>Thread not found</em>
  );

  if (thread.isEmpty) {
    return renderThreadNotFound();
  }

  if (!category) {
    return <em>{'Thread\'s category was not found.'}</em>;
  } else if (category.deleted) {
    return renderThreadNotFound();
  }

  if (preview) {
    return <ThreadPreview thread={thread} repliesCount={totalPostsInThread - 1} />;
  }

  const changePageAndClearSelectedPost = (page?: number | string) => {
    setSelectedPostIdx(null);
    setCurrentPage(page, [ReplyIdxQueryParam]);
  };

  const scrollToReplyForm = () => {
    if (!replyFormRef.current) return;
    replyFormRef.current.scrollIntoView();
  };

  const clearEditedPost = () => {
    setEditedPostId(null);
  };

  const onThreadReplyClick = () => {
    clearEditedPost();
    setQuotedPost(null);
    scrollToReplyForm();
  };

  const onPostEditSuccess = async () => {
    if (!editedPostId) {
      // eslint-disable-next-line no-console
      console.error('editedPostId not set!');

      return;
    }

    const updatedPost = await api.query.forum.postById(editedPostId) as Post;
    const updatedPosts = posts.map((post) => post.id.eq(editedPostId) ? updatedPost : post);

    setPosts(updatedPosts);
    clearEditedPost();
  };

  // console.log({ nextPostId: bnToStr(nextPostId), loaded, posts });

  const renderPageOfPosts = () => {
    if (!loaded) {
      return <em>Loading posts...</em>;
    }

    const pagination =
      <Pagination
        currentPage={currentPage}
        totalItems={posts.length}
        itemsPerPage={RepliesPerPage}
        onPageChange={changePageAndClearSelectedPost}
      />;

    const renderedReplies = displayedPosts.map((reply) => {
      const replyIdx = reply.nr_in_thread.toNumber();

      const onReplyEditClick = () => {
        setEditedPostId(reply.id.toString());
        scrollToReplyForm();
      };

      const onReplyQuoteClick = () => {
        setQuotedPost(reply);
        scrollToReplyForm();
      };

      return (
        <ViewReply
          ref={postsRefs.current[replyIdx]}
          key={replyIdx}
          category={category}
          thread={thread}
          reply={reply}
          selected={selectedPostIdx === replyIdx}
          onEdit={onReplyEditClick}
          onQuote={onReplyQuoteClick}
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
      <Button onClick={onThreadReplyClick}>
        <Icon name='reply' />
        Reply
      </Button>

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
          Created by
          <ThreadInfoMemberPreview accountId={thread.author_id} size='small' showId={false}/>
          <TimeAgoDate date={thread.created_at.momentDate} id='thread' />
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
    <ReplyEditContainer ref={replyFormRef}>
      {
        editedPostId ? (
          <EditReply id={editedPostId} key={editedPostId.toString()} onEditSuccess={onPostEditSuccess} onEditCancel={clearEditedPost} />
        ) : (
          <NewReply threadId={thread.id} key={quotedPost?.id.toString()} quotedPost={quotedPost} />
        )
      }
    </ReplyEditContainer>
  </div>;
}

export const ViewThread = withMulti(
  InnerViewThread,
  withApi,
  withForumCalls<ViewThreadProps>(
    ['nextPostId', { propName: 'nextPostId' }]
  )
);

type ViewThreadByIdProps = RouteComponentProps<{ id: string }>;

export function ViewThreadById (props: ViewThreadByIdProps) {
  const { api } = useApi();
  const { match: { params: { id } } } = props;
  const [loaded, setLoaded] = useState(false);
  const [thread, setThread] = useState(api.createType('Thread', {}));
  const [category, setCategory] = useState(api.createType('Category', {}));

  let threadId: ThreadId | undefined;

  try {
    threadId = api.createType('ThreadId', id);
  } catch (err) {
    console.log('Failed to parse thread id form URL');
  }

  useEffect(() => {
    const loadThreadAndCategory = async () => {
      if (!threadId) return;

      const thread = await api.query.forum.threadById(threadId) as Thread;
      const category = await api.query.forum.categoryById(thread.category_id) as Category;

      setThread(thread);
      setCategory(category);
      setLoaded(true);
    };

    void loadThreadAndCategory();
  }, [id]);

  if (threadId === undefined) {
    return <em>Invalid thread ID: {id}</em>;
  }

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
