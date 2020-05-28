import BN from 'bn.js';
import React from 'react';

import { withCalls } from '@polkadot/react-api/with';

import { nonEmptyStr } from '../index';
import TextArea from '../TextArea';

type Props = {
  accountId: string;
  onChange: (memo: string) => void;
  onReset: (memo: string) => void;
  maxLen?: BN;
  storedMemo?: Text;
};

type State = {
  memo: string;
  loadedMemo: boolean;
};

class Component extends React.PureComponent<Props, State> {
  static getDerivedStateFromProps (props: Props, currentState: State) {
    const { storedMemo } = props;
    const { memo, loadedMemo } = currentState;
    if (storedMemo && !memo && !loadedMemo) {
      // only set loaded memo once
      return {
        memo: storedMemo.toString(),
        loadedMemo: true
      };
    }
    return null;
  }

  state: State = {
    memo: '',
    loadedMemo: false
  };

  render () {
    const { memo } = this.state;
    return (
      <TextArea
        rows={3}
        autoHeight={true}
        label='Memo (supports Markdown):'
        placeholder='Here you can type any public information relevant to your account.'
        value={memo}
        onChange={this.onChange}
      />
    );
  }

  private onChange = (memo: string) => {
    const { maxLen, onChange, onReset, storedMemo } = this.props;
    if (maxLen && nonEmptyStr(memo)) {
      memo = memo.substring(0, maxLen.toNumber());
    }
    this.setState({ memo });

    if (storedMemo && memo === storedMemo.toString()) {
      if (onReset) {
        onReset(memo);
      }
    } else {
      if (onChange) {
        onChange(memo);
      }
    }
  }
}

// inject the actual API calls automatically into props
export default withCalls<Props>(
  ['query.memo.maxMemoLength', { propName: 'maxLen' }],
  ['query.memo.memo', { paramName: 'accountId', propName: 'storedMemo' }]
)(Component);
