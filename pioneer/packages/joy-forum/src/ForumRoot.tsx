import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { orderBy } from 'lodash';
import BN from 'bn.js';

import Section from '@polkadot/joy-utils/Section';
import { withMulti, withApi } from '@polkadot/react-api';
import { PostId } from '@joystream/types/common';
import { Post, Thread } from '@joystream/types/forum';
import { bnToStr } from '@polkadot/joy-utils/';
import { ApiProps } from '@polkadot/react-api/types';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';

import { CategoryCrumbs, RecentActivityPostsCount, ReplyIdxQueryParam, TimeAgoDate } from './utils';
import { withForumCalls } from './calls';
import { CategoryList } from './CategoryList';

const ForumRoot: React.FC = () => {
  return (
    <>
      <CategoryCrumbs root />
      <RecentActivity />
      <Section title="Top categories">
        <CategoryList />
      </Section>
    </>
  );
};

const RecentActivityEntry = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 0;

  &:not(:last-child) {
    border-bottom: 1px solid #ddd;
  }
`;

const StyledMemberPreview = styled(MemberPreview)`
  && {
    margin-right: .3rem;
  }
`;

const StyledPostLink = styled(Link)`
  margin: 0 .3rem;
  font-weight: 700;
`;

type RecentActivityProps = ApiProps & {
  nextPostId?: PostId;
};

const InnerRecentActivity: React.FC<RecentActivityProps> = ({ nextPostId, api }) => {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [threadsLookup, setThreadsLookup] = useState<Record<number, Thread>>({});

  useEffect(() => {
    const loadPosts = async () => {
      if (!nextPostId) return;

      const newId = (id: number | BN) => new PostId(id);
      const apiCalls: Promise<Post>[] = [];
      let id = newId(1);
      while (nextPostId.gt(id)) {
        apiCalls.push(api.query.forum.postById(id) as Promise<Post>);
        id = newId(id.add(newId(1)));
      }

      const allPosts = await Promise.all(apiCalls);
      const sortedPosts = orderBy(
        allPosts,
        [x => x.id.toNumber()],
        ['desc']
      );

      const threadsIdsLookup = {} as Record<number, boolean>;
      const postsWithUniqueThreads = sortedPosts.reduce((acc, post) => {
        const threadId = post.thread_id.toNumber();
        if (threadsIdsLookup[threadId]) return acc;

        threadsIdsLookup[threadId] = true;
        return [
          ...acc,
          post
        ];
      }, [] as Post[]);

      const recentUniquePosts = postsWithUniqueThreads.slice(0, RecentActivityPostsCount);
      setRecentPosts(recentUniquePosts);
      setLoaded(true);
    };

    loadPosts();
  }, [bnToStr(nextPostId)]);

  useEffect(() => {
    const loadThreads = async () => {
      const apiCalls: Promise<Thread>[] = recentPosts
        .filter(p => !threadsLookup[p.thread_id.toNumber()])
        .map(p => api.query.forum.threadById(p.thread_id) as Promise<Thread>);

      const threads = await Promise.all(apiCalls);
      const newThreadsLookup = threads.reduce((acc, thread) => {
        acc[thread.id.toNumber()] = thread;
        return acc;
      }, {} as Record<number, Thread>);
      const newLookup = {
        ...threadsLookup,
        ...newThreadsLookup
      };

      setThreadsLookup(newLookup);
    };

    loadThreads();
  }, [recentPosts]);

  const renderSectionContent = () => {
    if (!loaded) {
      return <i>Loading recent activity...</i>;
    }
    if (loaded && !recentPosts.length) {
      return <span>No recent activity</span>;
    }

    return recentPosts.map(p => {
      const threadId = p.thread_id.toNumber();

      const postLinkSearch = new URLSearchParams();
      postLinkSearch.set(ReplyIdxQueryParam, p.nr_in_thread.toString());
      const postLinkPathname = `/forum/threads/${threadId}`;

      const thread = threadsLookup[threadId];

      return (
        <RecentActivityEntry key={p.id.toNumber()}>
          <StyledMemberPreview accountId={p.author_id} inline />
          posted in
          {thread && (
            <StyledPostLink to={{ pathname: postLinkPathname, search: postLinkSearch.toString() }}>{thread.title}</StyledPostLink>
          )}
          <TimeAgoDate date={p.created_at.momentDate} id={p.id.toNumber()} />
        </RecentActivityEntry>
      );
    });
  };

  return (
    <Section title="Recent activity">
      {renderSectionContent()}
    </Section>
  );
};

const RecentActivity = withMulti<RecentActivityProps>(
  InnerRecentActivity,
  withApi,
  withForumCalls(
    ['nextPostId', { propName: 'nextPostId' }]
  )
);

export default ForumRoot;
