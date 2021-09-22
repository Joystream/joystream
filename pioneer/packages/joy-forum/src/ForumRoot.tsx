import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import BN from 'bn.js';

import { Section } from '@polkadot/joy-utils/react/components';
import { withMulti, withApi } from '@polkadot/react-api';
import { PostId } from '@joystream/types/common';
import { Post, Thread } from '@joystream/types/forum';
import { bnToStr } from '@polkadot/joy-utils/functions/misc';
import { ApiProps } from '@polkadot/react-api/types';
import MemberPreview from '@polkadot/joy-utils/react/components/MemberByAccountPreview';

import { CategoryCrumbs, RecentActivityPostsCount, ReplyIdxQueryParam, TimeAgoDate } from './utils';
import { withForumCalls } from './calls';
import { CategoryList } from './CategoryList';

const ForumRoot: React.FC = () => {
  return (
    <>
      <CategoryCrumbs root />
      <RecentActivity />
      <Section title='Top categories'>
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

      const newId = (id: number | BN) => api.createType('PostId', id);
      let id = newId(nextPostId.toNumber() - 1);

      const threadsIdsLookup = {} as Record<number, boolean>;
      const recentUniquePosts = new Array<Post>();

      while (id.gt(newId(0))) {
        const post = await api.query.forum.postById(id) as Post;

        const threadId = post.thread_id.toNumber();

        id = newId(id.toNumber() - 1);

        if (threadsIdsLookup[threadId]) continue;

        threadsIdsLookup[threadId] = true;

        recentUniquePosts.push(post);

        if (recentUniquePosts.length === RecentActivityPostsCount) {
          break;
        }
      }

      setRecentPosts(recentUniquePosts);
      setLoaded(true);
    };

    void loadPosts();
  }, [bnToStr(nextPostId)]);

  useEffect(() => {
    const loadThreads = async () => {
      const apiCalls: Promise<Thread>[] = recentPosts
        .filter((p) => !threadsLookup[p.thread_id.toNumber()])
        .map((p) => api.query.forum.threadById(p.thread_id) as Promise<Thread>);

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

    void loadThreads();
  }, [recentPosts]);

  const renderSectionContent = () => {
    if (!loaded) {
      return <i>Loading recent activity...</i>;
    }

    if (loaded && !recentPosts.length) {
      return <span>No recent activity</span>;
    }

    return recentPosts.map((p) => {
      const threadId = p.thread_id.toNumber();

      const postLinkSearch = new URLSearchParams();

      postLinkSearch.set(ReplyIdxQueryParam, p.nr_in_thread.toString());
      const postLinkPathname = `/forum/threads/${threadId}`;

      const thread = threadsLookup[threadId];

      return (
        <RecentActivityEntry key={p.id.toNumber()}>
          <StyledMemberPreview accountId={p.author_id} size='small' showId={false}/>
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
    <Section title='Recent activity'>
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
