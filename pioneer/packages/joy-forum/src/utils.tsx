import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { Breadcrumb, Pagination as SuiPagination } from 'semantic-ui-react';
import styled from 'styled-components';
import moment from 'moment';
import Tooltip from 'react-tooltip';

import { ThreadId } from '@joystream/types/common';
import { Category, CategoryId, Thread } from '@joystream/types/forum';
import { withForumCalls } from './calls';
import { withMulti } from '@polkadot/react-api';

export const ThreadsPerPage = 10;
export const RepliesPerPage = 10;
export const RecentActivityPostsCount = 7;
export const ReplyIdxQueryParam = 'replyIdx';
export const ReplyEditIdQueryParam = 'editReplyId';
export const PagingQueryParam = 'page';

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
  root?: boolean;
};

function InnerCategoryCrumb (p: CategoryCrumbsProps) {
  const { category } = p;

  if (category) {
    try {
      const url = `/forum/categories/${category.id.toString()}`;
      return <>
        {category.parent_id ? <CategoryCrumb categoryId={category.parent_id} /> : null}
        <Breadcrumb.Divider icon="right angle" />
        <Breadcrumb.Section as={Link} to={url}>{category.title}</Breadcrumb.Section>
      </>;
    } catch (err) {
      console.log('Failed to create a category breadcrumb', err);
    }
  }

  return null;
}

const CategoryCrumb = withMulti(
  InnerCategoryCrumb,
  withForumCalls<CategoryCrumbsProps>(
    ['categoryById', { propName: 'category', paramName: 'categoryId' }]
  )
);

function InnerThreadCrumb (p: CategoryCrumbsProps) {
  const { thread } = p;

  if (thread) {
    try {
      const url = `/forum/threads/${thread.id.toString()}`;
      return <>
        <CategoryCrumb categoryId={thread.category_id} />
        <Breadcrumb.Divider icon="right angle" />
        <Breadcrumb.Section as={Link} to={url}>{thread.title}</Breadcrumb.Section>
      </>;
    } catch (err) {
      console.log('Failed to create a thread breadcrumb', err);
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

const StyledBreadcrumbs = styled(Breadcrumb)`
  && {
    font-size: 1.3rem;
    line-height: 1.2;
  }
`;

export const CategoryCrumbs = ({ categoryId, threadId, root }: CategoryCrumbsProps) => {
  return (
    <StyledBreadcrumbs>
      <Breadcrumb.Section>Forum</Breadcrumb.Section>
      {!root && (
        <>
          <Breadcrumb.Divider icon="right angle" />
          <Breadcrumb.Section as={Link} to="/forum">Top categories</Breadcrumb.Section>
          <CategoryCrumb categoryId={categoryId} />
          <ThreadCrumb threadId={threadId} />
        </>
      )}
    </StyledBreadcrumbs>
  );
};

type TimeAgoDateProps = {
  date: moment.Moment;
  id: any;
};

export const TimeAgoDate: React.FC<TimeAgoDateProps> = ({ date, id }) => (
  <>
    <span data-tip data-for={`${id}-date-tooltip`}>
      {date.fromNow()}
    </span>
    <Tooltip id={`${id}-date-tooltip`} place="top" effect="solid">
      {date.toLocaleString()}
    </Tooltip>
  </>
);

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

type QueryValueType = string | null;
type QuerySetValueType = (value?: QueryValueType | number, paramsToReset?: string[]) => void;
type QueryReturnType = [QueryValueType, QuerySetValueType];

export const useQueryParam = (queryParam: string): QueryReturnType => {
  const { pathname, search } = useLocation();
  const history = useHistory();
  const [value, setValue] = useState<QueryValueType>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const paramValue = params.get(queryParam);
    if (paramValue !== value) {
      setValue(paramValue);
    }
  }, [search, setValue, queryParam]);

  const setParam: QuerySetValueType = (rawValue, paramsToReset = []) => {
    let parsedValue: string | null;
    if (!rawValue && rawValue !== 0) {
      parsedValue = null;
    } else {
      parsedValue = rawValue.toString();
    }

    const params = new URLSearchParams(search);
    if (parsedValue) {
      params.set(queryParam, parsedValue);
    } else {
      params.delete(queryParam);
    }

    paramsToReset.forEach(p => params.delete(p));

    setValue(parsedValue);
    history.push({ pathname, search: params.toString() });
  };

  return [value, setParam];
};

export const usePagination = (): [number, QuerySetValueType] => {
  const [rawCurrentPage, setCurrentPage] = useQueryParam(PagingQueryParam);

  let currentPage = 1;
  if (rawCurrentPage) {
    const parsedPage = Number.parseInt(rawCurrentPage);
    if (!Number.isNaN(parsedPage)) {
      currentPage = parsedPage;
    } else {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse URL page idx');
    }
  }

  return [currentPage, setCurrentPage];
};
