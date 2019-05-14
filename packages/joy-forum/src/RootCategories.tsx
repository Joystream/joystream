import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table } from 'semantic-ui-react';

import { CategoryId, ThreadId } from './types';
import { useForum } from './Context';
import { ViewThread } from './ViewThread';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';
import { UrlHasIdProps, AuthorPreview } from './utils';
import Section from '@polkadot/joy-utils/Section';

type ViewCategoryProps = {
  id: CategoryId,
  preview?: boolean
};

function CategoryActions ({ id }: { id: CategoryId }) {
  const className = 'ui small button ActionButton';
  return (
    <>
    <Link
      to={`/forum/categories/${id.toString()}/newThread`}
      className={className}
    >
      <i className='add icon' />
      New thread
    </Link>
    <Link
      to={`/forum/categories/${id.toString()}/edit`}
      className={className}
    >
      <i className='pencil alternate icon' />
      Edit
    </Link>
    <button
      className={className}
      onClick={() => alert('TODO Archive this category')}
    >
      <i className='file archive outline icon' />
      Archive
    </button>
    <button
      className={className}
      onClick={() => alert('TODO Delete this category')}
    >
      <i className='trash alternate outline icon' />
      Delete
    </button>
    </>
  );
}

function ViewCategory (props: ViewCategoryProps) {
  const { state: {
    categoryById,
    categoryIdsByParentId,
    threadIdsByCategoryId
  } } = useForum();

  const { id, preview = false } = props;
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

  if (!category) {
    return <em>Category not found</em>;
  }

  return (<>

    {/* TODO show bread crumbs to this category */}

    <h1 style={{ display: 'flex' }}>
      {category.name}
      <CategoryActions id={id} />
    </h1>
    <div>
      <MutedSpan>Moderator: </MutedSpan>
      <AuthorPreview address={category.owner} />
    </div>
    <div style={{ marginTop: '1rem' }}>
      <ReactMarkdown className='JoyMemo--full' source={category.text} linkTarget='_blank' />
    </div>

    {/* TODO refactor: extract to a separate component: CategoryThreads */}
    <Section title='Threads'>
    {threadIds.length === 0
      ? <em>No threads in this category</em>
      : <Table celled selectable compact>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Thread</Table.HeaderCell>
          <Table.HeaderCell>Replies</Table.HeaderCell>
          <Table.HeaderCell>Moderator</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{threadIds.map((id, i) => (
        <ViewThread key={i} id={new ThreadId(id)} preview />
      ))}</Table.Body>
      </Table>
    }
    </Section>
  </>);
}

export function ViewCategoryById (props: UrlHasIdProps) {
  const { match: { params: { id } } } = props;
  try {
    return <ViewCategory id={new CategoryId(id)} />;
  } catch (err) {
    return <em>Invalid category ID: {id}</em>;
  }
}

export function RootCategories () {
  const { state: { rootCategoryIds: ids } } = useForum();
  if (!ids || ids.length === 0) {
    return <em>Forum is empty</em>;
  }

  return (
    <Table celled selectable compact>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Root category</Table.HeaderCell>
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
