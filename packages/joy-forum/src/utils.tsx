import React from 'react';
import { Link } from 'react-router-dom'
import { Pagination as SuiPagination } from 'semantic-ui-react';

import { AccountId, AccountIndex, Address } from '@polkadot/types';
import AddressMini from '@polkadot/ui-app/AddressMiniJoy';
import { CategoryId, ThreadId } from './types';
import { useForum } from './Context';

export const ThreadsPerPage = 10;
export const RepliesPerPage = 10;

type AuthorPreviewProps = {
  address: AccountId | AccountIndex | Address | string
};

// TODO show member instead of address.
export function AuthorPreview ({ address }: AuthorPreviewProps) {
  return (
    <AddressMini value={address} isShort={false} isPadded={false} withBalance={true} withName={true} withMemo={false} size={36} />
  );
}

type PaginationProps = {
  currentPage?: number,
  totalItems: number,
  itemsPerPage?: number,
  onPageChange: (activePage?: string | number) => void
};

export const Pagination = (p: PaginationProps) => {
  const { currentPage = 1, itemsPerPage = 20 } = p;
  const totalPages = Math.floor(p.totalItems / itemsPerPage);

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
  categoryId?: CategoryId
  threadId?: ThreadId
};

const CategoryCrumb = (p: CategoryCrumbsProps) => {
  const { state: { categoryById } } = useForum();
  const { categoryId: id } = p;

  if (id) {
    try {
      const category = categoryById.get(id.toNumber());
      if (category) {
        const url = `/forum/categories/${id.toString()}`;
        return <>
          {category.parent_id ? <CategoryCrumb categoryId={category.parent_id} /> : null}
          <i className='right angle icon divider'></i>
          <Link className='section' to={url}>{category.name}</Link>
        </>;
      }
    } catch (err) {
      console.log('Failed to create a category breadcrumb', err);
    }
  }

  return null;
};

const ThreadCrumb = (p: CategoryCrumbsProps) => {
  const { state: { threadById } } = useForum();
  const { threadId: id } = p;

  if (id) {
    try {
      const thread = threadById.get(id.toNumber());
      if (thread) {
        const url = `/forum/threads/${id.toString()}`;
        return <>
          <CategoryCrumb categoryId={thread.category_id} />
          <i className='right angle icon divider'></i>
          <Link className='section' to={url}>{thread.title}</Link>
        </>;
      }
    } catch (err) {
      console.log('Failed to create a thread breadcrumb', err);
    }
  }

  return null;
};

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
      id: string
    }
  }
};
