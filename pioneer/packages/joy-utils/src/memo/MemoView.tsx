import React from 'react';
import ReactMarkdown from 'react-markdown';
import { truncate } from 'lodash';

import { withCalls } from '@polkadot/react-api/index';

import { nonEmptyStr } from '../index';
import './Memo.css';
import { Link } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const remark = require('remark');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const strip = require('strip-markdown');
const mdStripper = remark().use(strip);

type Props = {
  accountId: string;
  memo?: Text;
  preview?: boolean;
  showEmpty?: boolean;
  className?: string;
  style?: any;
};

class Component extends React.PureComponent<Props> {
  private mdToPlainText = (md: string): string => {
    if (nonEmptyStr(md)) {
      try {
        return mdStripper.processSync(md).toString().trim();
      } catch (err) {
        console.log('Failed to convert markdown to plain text', err);
      }
    }
    return md;
  }

  private isMemoEmpty (): boolean {
    const { memo } = this.props;
    return !memo;
  }

  renderMemo () {
    const { memo, preview = true, accountId } = this.props;
    if (this.isMemoEmpty()) {
      return <em className='JoyMemo--empty'>Memo is empty.</em>;
    } else {
      const md = memo ? memo.toString().trim() : '';
      if (preview) {
        const plainText = this.mdToPlainText(md);
        const previewText = truncate(plainText, { length: 80, omission: '…' });
        return (
          <span className='JoyMemo--preview'>
            {previewText}
            <Link to={`/addressbook/memo/${accountId}`}>{' view full memo'}</Link>
          </span>
        );
      } else {
        return <ReactMarkdown className='JoyViewMD' source={md} linkTarget='_blank' />;
      }
    }
  }

  render () {
    const { showEmpty = true, className, style } = this.props;
    return this.isMemoEmpty() && !showEmpty ? null : <div className={className} style={style}>{this.renderMemo()}</div>;
  }
}

export default withCalls<Props>(
  ['query.memo.memo',
    { paramName: 'accountId', propName: 'memo' }]
)(Component);
