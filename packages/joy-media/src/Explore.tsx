import React from 'react';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls } from '@polkadot/react-api/with';
import { Vec as Vector } from '@polkadot/types';

import translate from './translate';
import { ContentId } from '@joystream/types/media';
import { View } from './View';

type Props = ApiProps & I18nProps & {
  contentIds?: Vector<ContentId>
};

class Component extends React.PureComponent<Props> {

  render () {
    const { contentIds } = this.props;
    if (contentIds === undefined) return <em>Loading...</em>;
    else if (contentIds.length === 0) return <em>No content found.</em>;
    else return this.renderPreviews(contentIds);
  }

  private renderPreviews (contentIds: Vector<ContentId>) {
    return (
      <div>
        <div className='MediaGrid'>
        {contentIds.map((contentId, i) =>
          <View key={i} contentId={contentId} preview={true} />
        )}
        </div>
      </div>
    );
  }
}

export default translate(
  withCalls<Props>(
    ['query.dataDirectory.knownContentIds', { propName: 'contentIds' } ]
  )(Component)
);
