import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table, Dropdown, Button, Segment, Label } from 'semantic-ui-react';
import { History } from 'history';
import orderBy from 'lodash/orderBy';
import BN from 'bn.js';

import { Bool } from '@polkadot/types';
import { CategoryId, Category, ThreadId, ThreadType, Thread } from './types';
import { useForum } from './Context';
import { ViewThread } from './ViewThread';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { UrlHasIdProps, AuthorPreview, CategoryCrumbs, Pagination, ThreadsPerPage } from './utils';
import Section from '@polkadot/joy-utils/Section';
import { JoyWarn } from '@polkadot/joy-utils/JoyWarn';
import { withForumCalls } from './calls';
import { withMulti, withApi } from '@polkadot/ui-api';
import { ApiProps } from '@polkadot/ui-api/types';

type CategoryActionsProps = {
  id: CategoryId
  category: Category
};

function CategoryActions (props: CategoryActionsProps) {
  const { id, category } = props;
  const { dispatch } = useForum();
  const className = 'ui button ActionButton';

  const updateBoolFieldOnCategory = (fieldName: string, flag: boolean) => {
    category.set(fieldName, new Bool(flag));
    dispatch({ type: 'UpdateCategory', category, id: id.toNumber() });
  };

  if (category.archived) {
    const unarchiveCategory = () => {
      updateBoolFieldOnCategory('archived', false);
    };
    {/* TODO show 'Unarchive' button only if I am forum sudo */}
    return (
      <Button icon='file archive outline' content='Unarchive' onClick={unarchiveCategory} />
    );
  }

  if (category.deleted) {
    const undeleteCategory = () => {
      updateBoolFieldOnCategory('deleted', false);
    };
    {/* TODO show 'Undelete' button only if I am forum sudo */}
    return (
      <Button icon='trash alternate outline' content='Undelete' onClick={undeleteCategory} />
    );
  }

  const archiveCategory = () => {
    updateBoolFieldOnCategory('archived', true);
  };

  const deleteCategory = () => {
    updateBoolFieldOnCategory('deleted', true);
  };

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
      <Link className={className} to={`/forum/categories/${id.toString()}/edit`}>
        <i className='pencil alternate icon' />
        <span className='text'>Edit</span>
      </Link>
      <Dropdown floating button className='icon small' style={{ display: 'inline-block', width: 'auto', margin: 0 }} trigger={<></>}>
        <Dropdown.Menu>

          {/* TODO show 'Add subcategory', 'Archive', 'Delete' button only if I am forum sudo */}
          <Link className='item' role='option' to={`/forum/categories/${id.toString()}/newSubcategory`}>
            <i className='add icon' />
            Add subcategory
          </Link>
          <Dropdown.Item icon='file archive outline' text='Archive' onClick={archiveCategory} />
          <Dropdown.Item icon='trash alternate outline' text='Delete' onClick={deleteCategory} />
        </Dropdown.Menu>
      </Dropdown>
    </Button.Group>
  </span>;
}

type InnerViewCategoryProps = {
  category?: Category,
  page?: number,
  preview?: boolean,
  history?: History
};

type ViewCategoryProps = InnerViewCategoryProps & {
  id: CategoryId
};

const ViewCategory = withForumCalls<ViewCategoryProps>(
  ['categoryById', { propName: 'category', paramName: 'id' }]
)(InnerViewCategory);

function InnerViewCategory (props: InnerViewCategoryProps) {
  const { state: {
    threadIdsByCategoryId
  }} = useForum();

  const { history, category, page = 1, preview = false } = props;

  if (!category) {
    return <em>Loading...</em>;
  }

  if (category.isEmpty) {
    return preview ? null : <em>Category not found</em>;
  }

  const { id } = category;
  const hasSubcats = !category.num_direct_subcategories.isZero();

  // TODO replace w/ Substrate
  const threadIds = threadIdsByCategoryId.get(id.toNumber()) || [];

  const renderCategoryActions = () => {
    return <CategoryActions id={id} category={category} />;
  };

  if (preview) {
    return (
      <Table.Row>
        <Table.Cell>
          <Link to={`/forum/categories/${id.toString()}`}>
            {category.archived
              ? <MutedSpan><Label color='orange'>Archived</Label> {category.title}</MutedSpan>
              : category.title
            }
          </Link>
        </Table.Cell>
        <Table.Cell>
          {category.num_direct_subcategories.toString()}
        </Table.Cell>
        <Table.Cell>
          {category.num_direct_unmoderated_threads.toString()}
        </Table.Cell>
        <Table.Cell>
          {renderCategoryActions()}
        </Table.Cell>
        <Table.Cell>
          <AuthorPreview address={category.moderator_id} />
        </Table.Cell>
      </Table.Row>
    );
  }

  if (!history) {
    return <em>Error: <code>history</code> property was not found.</em>;
  }

  const renderSubCategoriesAndThreads = () => <>
    {category.archived &&
      <JoyWarn title={`This category is archived.`}>
        No new subcategories, threads and posts can be added to it.
      </JoyWarn>
    }

    <Segment>
      <div>
        <MutedSpan>Moderator: </MutedSpan>
        <AuthorPreview address={category.moderator_id} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ReactMarkdown className='JoyMemo--full' source={category.description} linkTarget='_blank' />
      </div>
    </Segment>

    {hasSubcats &&
      <Section title={`Subcategories (${category.num_direct_subcategories.toString()})`}>
        <CategoryList parentId={id} />
      </Section>
    }

    <Section title={`Threads (${threadIds.length})`}>
      <CategoryThreads categoryId={id} threadIds={threadIds} page={page} history={history} />
    </Section>
  </>;

  return (<>
    <CategoryCrumbs categoryId={category.parent_id} />
    <h1 className='ForumPageTitle'>
      <span className='TitleText'>{category.title}</span>
      {renderCategoryActions()}
    </h1>

    {category.deleted
      ? <JoyWarn title={`This category is deleted`} />
      : renderSubCategoriesAndThreads()
    }
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
    // pinned: boolean,
    moderated: boolean
  };

  const threads: SortableThread[] = threadIds
    .map(id => {
      const thread = threadById.get(id);
      return !thread ? thread : {
        id,
        // pinned: thread.pinned,
        moderated: thread.moderation !== undefined
      };
    })
    .filter(x => x !== undefined) as SortableThread[];

  const sortedThreadIds = orderBy(threads,
    // TODO Replace sort by id with sort by blocktime of the last reply.
    [
      x => x.moderated,
      // x => x.pinned,
      x => x.id ],
    [
      'asc',
      // 'desc',
      'desc'
    ]
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

type CategoryListProps = ApiProps & {
  nextCategoryId?: CategoryId,
  parentId?: CategoryId
};

export const CategoryList = withMulti(
  InnerCategoryList,
  withApi,
  withForumCalls<CategoryListProps>(
    ['nextCategoryId', { propName: 'nextCategoryId' }]
  )
);

function InnerCategoryList (props: CategoryListProps) {
  const { api, parentId, nextCategoryId } = props;
  const [catsLoaded, setCatsLoaded] = useState(false);
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
      setCatsLoaded(true);
    };

    loadCategories();
  }, [parentId, nextCategoryId]);

  if (!catsLoaded) {
    return <em>Loading categories...</em>;
  }

  if (!categories) {
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
    <Table.Body>{categories.map((category, i) => (
      <InnerViewCategory key={i} preview category={category} />
    ))}</Table.Body>
    </Table>
  );
}
