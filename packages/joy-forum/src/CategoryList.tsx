import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table, Dropdown, Button, Segment } from 'semantic-ui-react';
import { History } from 'history';
import orderBy from 'lodash/orderBy';

import { CategoryId, ThreadId, Thread, ThreadType } from './types';
import { useForum } from './Context';
import { ViewThread } from './ViewThread';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { UrlHasIdProps, AuthorPreview, CategoryCrumbs, Pagination, ThreadsPerPage } from './utils';
import Section from '@polkadot/joy-utils/Section';

function CategoryActions ({ id }: { id: CategoryId }) {
  const className = 'ui small button ActionButton';

  return <>
    <Link
      to={`/forum/categories/${id.toString()}/newThread`}
      className={className}
    >
      <i className='add icon' />
      New thread
    </Link>

    {/* TODO show 'Edit', 'Archive', 'Delete' button only if I am owner */}

    <Button.Group>
      <Link className={className} to={`/forum/categories/${id.toString()}/edit`}>
        <i className='pencil alternate icon' />
        <span className='text'>Edit</span>
      </Link>
      <Dropdown floating button className='icon small' style={{ display: 'inline-block', width: 'auto', margin: 0 }} trigger={<></>}>
        <Dropdown.Menu>
          <Dropdown.Item icon='file archive outline' text='Archive' onClick={() => alert('TODO Archive this category')} />
          <Dropdown.Item icon='trash alternate outline' text='Delete' onClick={() => alert('TODO Delete this category')} />
        </Dropdown.Menu>
      </Dropdown>
    </Button.Group>
  </>;
}

type ViewCategoryProps = {
  id: CategoryId,
  page?: number,
  preview?: boolean,
  history?: History
};

function ViewCategory (props: ViewCategoryProps) {
  const { state: {
    categoryById,
    categoryIdsByParentId,
    threadIdsByCategoryId
  } } = useForum();

  const { history, id, page = 1, preview = false } = props;
  const category = categoryById.get(id.toNumber());
  const subcategories = categoryIdsByParentId.get(id.toNumber()) || [];
  const threadIds = threadIdsByCategoryId.get(id.toNumber()) || [];

  if (preview) {
    return !category
      ? <></>
      : (
        <Table.Row>
          <Table.Cell>
            <Link to={`/forum/categories/${id.toString()}`}>{category.name}</Link>
          </Table.Cell>
          <Table.Cell>
            {subcategories.length}
          </Table.Cell>
          <Table.Cell>
            {threadIds.length}
          </Table.Cell>
          <Table.Cell>
            <CategoryActions id={id} />
          </Table.Cell>
          <Table.Cell>
            <AuthorPreview address={category.owner} />
          </Table.Cell>
        </Table.Row>
      );
  }

  if (!category || !history) {
    return <em>Category not found</em>;
  }

  return (<>
    <CategoryCrumbs categoryId={category.parent_id} />
    <h1 className='ForumPageTitle'>
      <span className='TitleText'>{category.name}</span>
      <CategoryActions id={id} />
    </h1>
    <Segment>
      <div>
        <MutedSpan>Moderator: </MutedSpan>
        <AuthorPreview address={category.owner} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ReactMarkdown className='JoyMemo--full' source={category.text} linkTarget='_blank' />
      </div>
    </Segment>

    {subcategories.length > 0 &&
      <Section title={`Subcategories (${subcategories.length})`}>
        <CategoryList parentId={id} />
      </Section>
    }

    <Section title={`Threads (${threadIds.length})`}>
      <CategoryThreads categoryId={id} threadIds={threadIds} page={page} history={history} />
    </Section>
  </>);
}

type CategoryThreadsProps = {
  categoryId: CategoryId,
  threadIds: number[],
  page: number,
  history: History
};

function CategoryThreads (props: CategoryThreadsProps) {
  const { categoryId, threadIds, page, history } = props;
  const { state: { threadById } } = useForum();

  if (threadIds.length === 0) {
    return <em>No threads in this category</em>;
  }

  const onPageChange = (activePage?: string | number) => {
    history.push(`/forum/categories/${categoryId.toString()}/page/${activePage}`);
  };

  const itemsPerPage = ThreadsPerPage;
  const minIdx = (page - 1) * itemsPerPage;
  const maxIdx = minIdx + itemsPerPage - 1;

  const pagination =
    <Pagination
      currentPage={page}
      totalItems={threadIds.length}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
    />;

  type SortableThread = ThreadType & {
    id: number,
    pinned: boolean
  };

  const threads: SortableThread[] = threadIds
    .map(id => {
      const thread = threadById.get(id);
      return !thread ? thread : { id, pinned: thread.pinned };
    })
    .filter(x => x !== undefined) as SortableThread[];

  const sortedThreadIds = orderBy(threads,
    // TODO Replace sort by id with sort by blocktime of the last reply.
    [ x => x.pinned, x => x.id ],
    [ 'desc', 'desc' ]
  ).map(x => x.id);

  const pageOfItems = sortedThreadIds
    .filter((_id, i) => i >= minIdx && i <= maxIdx)
    .map((id, i) => <ViewThread key={i} id={new ThreadId(id)} preview />);

  return <>
    {pagination}
    <Table celled selectable compact>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Thread</Table.HeaderCell>
          <Table.HeaderCell>Replies</Table.HeaderCell>
          <Table.HeaderCell>Moderator</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {pageOfItems}
      </Table.Body>
    </Table>
    {pagination}
  </>;
}

type ViewCategoryByIdProps = UrlHasIdProps & {
  history: History,
  match: {
    params: {
      id: string
      page?: string
    }
  }
};

export function ViewCategoryById (props: ViewCategoryByIdProps) {
  const { history, match: { params: { id, page: pageStr } } } = props;
  try {
    // tslint:disable-next-line:radix
    const page = pageStr ? parseInt(pageStr) : 1;
    return <ViewCategory id={new CategoryId(id)} page={page} history={history} />;
  } catch (err) {
    return <em>Invalid category ID: {id}</em>;
  }
}

type CategoryListProps = {
  parentId?: CategoryId
};

export function CategoryList (props: CategoryListProps) {
  const { state: { rootCategoryIds, categoryIdsByParentId } } = useForum();
  const { parentId } = props;

  const ids: number[] = parentId
    ? categoryIdsByParentId.get(parentId.toNumber()) || []
    : rootCategoryIds;

  if (!ids || ids.length === 0) {
    return <em>Forum is empty</em>;
  }

  return (
    <Table celled selectable compact>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Category</Table.HeaderCell>
        <Table.HeaderCell>Subcategories</Table.HeaderCell>
        <Table.HeaderCell>Threads</Table.HeaderCell>
        <Table.HeaderCell>Actions</Table.HeaderCell>
        <Table.HeaderCell>Moderator</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>{ids.map((id, i) => (
      <ViewCategory key={i} preview id={new CategoryId(id)} />
    ))}</Table.Body>
    </Table>
  );
}
