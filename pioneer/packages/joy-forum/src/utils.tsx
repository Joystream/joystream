import React from 'react';
import { Link } from 'react-router-dom';
import { Pagination as SuiPagination } from 'semantic-ui-react';

import { Category, CategoryId, Thread, ThreadId } from '@joystream/types/forum';
import { withForumCalls } from './calls';
import { withMulti } from '@polkadot/react-api';

export const ThreadsPerPage = 10;
export const RepliesPerPage = 10;

type PaginationProps = {
  currentPage?: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (activePage?: string | number) => void;
};

export const Pagination = (p: PaginationProps) => {
  const { currentPage = 1, itemsPerPage = 20 } = p;
  const totalPages = Math.ceil(p.totalItems / itemsPerPage);

  return totalPages <= 1 ? null : (
    <SuiPagination
      firstItem={null}
      lastItem={null}
      defaultActivePage={currentPage}
      totalPages={totalPages}
      onPageChange={(_event, { activePage }) => p.onPageChange(activePage)}
    />
  );
};

type CategoryCrumbsProps = {
  categoryId?: CategoryId;
  category?: Category;
  threadId?: ThreadId;
  thread?: Thread;
};

const CategoryCrumb = withMulti(
  InnerCategoryCrumb,
  withForumCalls<CategoryCrumbsProps>(
    ['categoryById', { propName: 'category', paramName: 'categoryId' }]
  )
);

function InnerCategoryCrumb (p: CategoryCrumbsProps) {
  const { category } = p;

  if (category) {
    try {
      const url = `/forum/categories/${category.id.toString()}`;
      return <>
        {category.parent_id ? <CategoryCrumb categoryId={category.parent_id} /> : null}
        <i className='right angle icon divider'></i>
        <Link className='section' to={url}>{category.title}</Link>
      </>;
    } catch (err) {
      console.log('Failed to create a category breadcrumb', err);
    }
  }

  return null;
}

const ThreadCrumb = withMulti(
  InnerThreadCrumb,
  withForumCalls<CategoryCrumbsProps>(
    ['threadById', { propName: 'thread', paramName: 'threadId' }]
  )
);

function InnerThreadCrumb (p: CategoryCrumbsProps) {
  const { thread } = p;

  if (thread) {
    try {
      const url = `/forum/threads/${thread.id.toString()}`;
      return <>
        <CategoryCrumb categoryId={thread.category_id} />
        <i className='right angle icon divider'></i>
        <Link className='section' to={url}>{thread.title}</Link>
      </>;
    } catch (err) {
      console.log('Failed to create a thread breadcrumb', err);
    }
  }

  return null;
}

export const CategoryCrumbs = (p: CategoryCrumbsProps) => {
  return (
    <div className='ui breadcrumb'>
      <Link className='section' to='/forum'>Top categories</Link>
      <CategoryCrumb categoryId={p.categoryId} />
      <ThreadCrumb threadId={p.threadId} />
    </div>
  );
};

// It's used on such routes as:
//   /categories/:id
//   /categories/:id/edit
//   /threads/:id
//   /threads/:id/edit
export type UrlHasIdProps = {
  match: {
    params: {
      id: string;
    };
  };
};
