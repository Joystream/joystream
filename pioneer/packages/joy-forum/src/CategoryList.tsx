import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table, Dropdown, Button, Segment, Label } from 'semantic-ui-react';
import styled from 'styled-components';
import orderBy from 'lodash/orderBy';
import BN from 'bn.js';

import { Option, bool } from '@polkadot/types';
import { ThreadId } from '@joystream/types/common';
import { CategoryId, Category, Thread } from '@joystream/types/forum';
import { ViewThread } from './ViewThread';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { UrlHasIdProps, CategoryCrumbs, Pagination, ThreadsPerPage, usePagination } from './utils';
import Section from '@polkadot/joy-utils/Section';
import { JoyWarn } from '@polkadot/joy-utils/JoyStatus';
import { withForumCalls } from './calls';
import { withMulti, withApi } from '@polkadot/react-api';
import { ApiProps } from '@polkadot/react-api/types';
import { bnToStr, isEmptyArr } from '@polkadot/joy-utils/index';
import TxButton from '@polkadot/joy-utils/TxButton';
import { IfIAmForumSudo } from './ForumSudo';
import { MemberPreview } from '@polkadot/joy-members/MemberPreview';

type CategoryActionsProps = {
  id: CategoryId;
  category: Category;
};

function CategoryActions (props: CategoryActionsProps) {
  const { id, category } = props;
  const className = 'ui button ActionButton';

  type BtnProps = {
    label: string;
    icon?: string;
    archive?: boolean;
    delete?: boolean;
  };

  const UpdateCategoryButton = (btnProps: BtnProps) => {
    return <TxButton
      className='item'
      isPrimary={false}
      label={<><i className={`${btnProps.icon} icon`} />{btnProps.label}</>}
      params={[id, new Option(bool, btnProps.archive), new Option(bool, btnProps.delete)]}
      tx={'forum.updateCategory'}
    />;
  };

  if (category.archived) {
    return (
      <IfIAmForumSudo>
        <UpdateCategoryButton icon='file archive outline' label='Unarchive' archive={false} />
      </IfIAmForumSudo>
    );
  }

  if (category.deleted) {
    return (
      <IfIAmForumSudo>
        <UpdateCategoryButton icon='trash alternate outline' label='Undelete' delete={false} />;
      </IfIAmForumSudo>
    );
  }

  return <span className='JoyInlineActions'>
    <Link
      to={`/forum/categories/${id.toString()}/newThread`}
      className={className}
    >
      <i className='add icon' />
      New thread
    </Link>

    <Button.Group>

      {/* TODO show 'Edit' if I am moderator_id */}
      {/* <Link className={className} to={`/forum/categories/${id.toString()}/edit`}>
        <i className='pencil alternate icon' />
        <span className='text'>Edit</span>
      </Link> */}

      <IfIAmForumSudo>
        <Dropdown floating button className='icon small' style={{ display: 'inline-block', width: 'auto', margin: 0 }} trigger={<></>}>
          <Dropdown.Menu>
            <Link className='item' role='option' to={`/forum/categories/${id.toString()}/newSubcategory`}>
              <i className='add icon' />
              Add subcategory
            </Link>
            <UpdateCategoryButton icon='file archive outline' label='Archive' archive={true} />
            <UpdateCategoryButton icon='trash alternate outline' label='Delete' delete={true} />
          </Dropdown.Menu>
        </Dropdown>
      </IfIAmForumSudo>

    </Button.Group>
  </span>;
}

type InnerViewCategoryProps = {
  category?: Category;
  preview?: boolean;
};

type ViewCategoryProps = InnerViewCategoryProps & {
  id: CategoryId;
};

const CategoryPreviewRow = styled(Table.Row)`
  height: 55px;
`;

function InnerViewCategory (props: InnerViewCategoryProps) {
  const { category, preview = false } = props;

  if (!category) {
    return <em>Loading...</em>;
  }

  if (category.isEmpty) {
    return preview ? null : <em>Category not found</em>;
  }

  const { id } = category;

  const renderCategoryActions = () => {
    return <CategoryActions id={id} category={category} />;
  };

  if (preview) {
    return (
      <CategoryPreviewRow>
        <Table.Cell>
          <Link to={`/forum/categories/${id.toString()}`}>
            {category.archived
              ? <MutedSpan><Label color='orange'>Archived</Label> {category.title}</MutedSpan>
              : category.title
            }
          </Link>
        </Table.Cell>
        <Table.Cell>
          {category.num_direct_unmoderated_threads.toString()}
        </Table.Cell>
        <Table.Cell>
          {category.num_direct_subcategories.toString()}
        </Table.Cell>
        <Table.Cell>
          {category.description}
        </Table.Cell>
      </CategoryPreviewRow>
    );
  }

  const renderSubCategoriesAndThreads = () => <>
    {category.archived &&
      <JoyWarn title={'This category is archived.'}>
        No new subcategories, threads and posts can be added to it.
      </JoyWarn>
    }

    <Segment>
      <div>
        <MemberPreview accountId={category.moderator_id} prefixLabel='Creator:' />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ReactMarkdown className='JoyMemo--full' source={category.description} linkTarget='_blank' />
      </div>
    </Segment>

    {category.hasSubcategories &&
      <Section title={`Subcategories (${category.num_direct_subcategories.toString()})`}>
        <CategoryList parentId={id} />
      </Section>
    }

    <Section title={`Threads (${category.num_direct_unmoderated_threads.toString()})`}>
      <CategoryThreads category={category} />
    </Section>
  </>;

  return (<>
    <CategoryCrumbs categoryId={category.parent_id} />
    <h1 className='ForumPageTitle'>
      <span className='TitleText'>{category.title}</span>
      {renderCategoryActions()}
    </h1>

    {category.deleted
      ? <JoyWarn title={'This category is deleted'} />
      : renderSubCategoriesAndThreads()
    }
  </>);
}

const ViewCategory = withForumCalls<ViewCategoryProps>(
  ['categoryById', { propName: 'category', paramName: 'id' }]
)(InnerViewCategory);

type InnerCategoryThreadsProps = {
  category: Category;
};

type CategoryThreadsProps = ApiProps & InnerCategoryThreadsProps & {
  nextThreadId?: ThreadId;
};

function InnerCategoryThreads (props: CategoryThreadsProps) {
  const { api, category, nextThreadId } = props;
  const [currentPage, setCurrentPage] = usePagination();

  if (!category.hasUnmoderatedThreads) {
    return <em>No threads in this category</em>;
  }

  const threadCount = category.num_threads_created.toNumber();
  const [loaded, setLoaded] = useState(false);
  const [threads, setThreads] = useState(new Array<Thread>());

  useEffect(() => {
    const loadThreads = async () => {
      if (!nextThreadId || threadCount === 0) return;

      const newId = (id: number | BN) => new ThreadId(id);
      const apiCalls: Promise<Thread>[] = [];
      let id = newId(1);
      while (nextThreadId.gt(id)) {
        apiCalls.push(api.query.forum.threadById(id) as Promise<Thread>);
        id = newId(id.add(newId(1)));
      }

      const allThreads = await Promise.all<Thread>(apiCalls);
      const threadsInThisCategory = allThreads.filter(item =>
        !item.isEmpty &&
        item.category_id.eq(category.id)
      );
      const sortedThreads = orderBy(
        threadsInThisCategory,
        // TODO UX: Replace sort by id with sort by blocktime of the last reply.
        [
          x => x.moderated,
          // x => x.pinned,
          x => x.nr_in_category.toNumber()
        ],
        [
          'asc',
          // 'desc',
          'desc'
        ]
      );

      setThreads(sortedThreads);
      setLoaded(true);
    };

    loadThreads();
  }, [bnToStr(category.id), bnToStr(nextThreadId)]);

  // console.log({ nextThreadId: bnToStr(nextThreadId), loaded, threads });

  if (!loaded) {
    return <em>Loading threads...</em>;
  }

  if (isEmptyArr(threads)) {
    return <em>No threads in this category</em>;
  }

  const itemsPerPage = ThreadsPerPage;
  const minIdx = (currentPage - 1) * itemsPerPage;
  const maxIdx = minIdx + itemsPerPage - 1;

  const pagination =
    <Pagination
      currentPage={currentPage}
      totalItems={threadCount}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
    />;

  const pageOfItems = threads
    .filter((_thread, i) => i >= minIdx && i <= maxIdx)
    .map((thread, i) => <ViewThread key={i} category={category} thread={thread} preview />);

  return <>
    {pagination}
    <Table celled selectable compact>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Thread</Table.HeaderCell>
          <Table.HeaderCell>Replies</Table.HeaderCell>
          <Table.HeaderCell>Creator</Table.HeaderCell>
          <Table.HeaderCell>Created</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {pageOfItems}
      </Table.Body>
    </Table>
    {pagination}
  </>;
}

export const CategoryThreads = withMulti(
  InnerCategoryThreads,
  withApi,
  withForumCalls<CategoryThreadsProps>(
    ['nextThreadId', { propName: 'nextThreadId' }]
  )
);

type ViewCategoryByIdProps = UrlHasIdProps & {
  match: {
    params: {
      id: string;
    };
  };
};

export function ViewCategoryById (props: ViewCategoryByIdProps) {
  const { match: { params: { id } } } = props;
  try {
    return <ViewCategory id={new CategoryId(id)} />;
  } catch (err) {
    return <em>Invalid category ID: {id}</em>;
  }
}

type CategoryListProps = ApiProps & {
  nextCategoryId?: CategoryId;
  parentId?: CategoryId;
};

function InnerCategoryList (props: CategoryListProps) {
  const { api, parentId, nextCategoryId } = props;
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState(new Array<Category>());

  useEffect(() => {
    const loadCategories = async () => {
      if (!nextCategoryId) return;

      const newId = (id: number | BN) => new CategoryId(id);
      const apiCalls: Promise<Category>[] = [];
      let id = newId(1);
      while (nextCategoryId.gt(id)) {
        apiCalls.push(api.query.forum.categoryById(id) as Promise<Category>);
        id = newId(id.add(newId(1)));
      }

      const allCats = await Promise.all<Category>(apiCalls);
      const filteredCats = allCats.filter(cat =>
        !cat.isEmpty &&
        !cat.deleted && // TODO show deleted categories if current user is forum sudo
        (parentId ? parentId.eq(cat.parent_id) : cat.isRoot)
      );

      setCategories(filteredCats);
      setLoaded(true);
    };

    loadCategories();
  }, [bnToStr(parentId), bnToStr(nextCategoryId)]);

  // console.log({ nextCategoryId: bnToStr(nextCategoryId), loaded, categories });

  if (!loaded) {
    return <em>Loading categories...</em>;
  }

  if (isEmptyArr(categories)) {
    return <em>Forum is empty</em>;
  }

  return (
    <Table celled selectable compact>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Category</Table.HeaderCell>
          <Table.HeaderCell>Threads</Table.HeaderCell>
          <Table.HeaderCell>Subcategories</Table.HeaderCell>
          <Table.HeaderCell>Description</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{categories.map((category, i) => (
        <InnerViewCategory key={i} preview category={category} />
      ))}</Table.Body>
    </Table>
  );
}

export const CategoryList = withMulti(
  InnerCategoryList,
  withApi,
  withForumCalls<CategoryListProps>(
    ['nextCategoryId', { propName: 'nextCategoryId' }]
  )
);
