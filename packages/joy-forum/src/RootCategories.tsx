import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Table } from 'semantic-ui-react';

import { CategoryId } from './types';
import AddressMini from '@polkadot/ui-app/AddressMiniJoy';
import { useForum } from './Context';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';

type ViewCategoryProps = {
  id: CategoryId,
  preview?: boolean
};

function ViewCategory (props: ViewCategoryProps) {
  const { id, preview = false } = props;
  const { state: { categoryById } } = useForum();
  const category = categoryById.get(id.toNumber());

  if (preview) {
    return !category
      ? <></>
      : (
        <Table.Row>
          <Table.Cell>
            <Link to={`/forum/categories/${id.toString()}`}>{category.name}</Link>
          </Table.Cell>
          <Table.Cell>
            {/* TODO show member instead of address */}
            <AddressMini value={category.owner} isShort={false} isPadded={false} withBalance={true} withName={true} withMemo={true} size={36} />
          </Table.Cell>
        </Table.Row>
      );
  }

  if (!category) {
    return <em>Category not found by ID: {id.toString()}</em>;
  }

  return (<>
    <h1 style={{ display: 'flex' }}>
      {category.name}
      <Link
        to={`/forum/categories/${id.toString()}/edit`}
        className='ui small button'
        style={{ marginLeft: '1rem' }}
      >Edit
      </Link>
    </h1>
    <div>
      <MutedSpan>Moderator: </MutedSpan>
      {/* TODO show member instead of address */}
      <AddressMini value={category.owner} isShort={false} isPadded={false} withBalance={true} withName={true} withMemo={true} size={36} />
    </div>
    <div style={{ marginTop: '1rem' }}>
      <ReactMarkdown className='JoyMemo--full' source={category.text} linkTarget='_blank' />
    </div>
  </>);
}

type UrlHasIdProps = {
  match: {
    params: {
      id: string
    }
  }
};

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
    return <em>No root categories</em>;
  }

  return (
    <Table celled selectable compact>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Root category</Table.HeaderCell>
        <Table.HeaderCell>Moderator</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>{ids.map((id, i) => (
      <ViewCategory key={i} preview id={new CategoryId(id)} />
    ))}</Table.Body>
    </Table>
  );
}
