import React from 'react';
import { Labelled } from '@polkadot/react-components/index';

import MemoEdit from '@polkadot/joy-utils/memo/MemoEdit';
import TxButton from '@polkadot/joy-utils/TxButton';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/MyAccount';
import { Text } from '@polkadot/types';

type Props = MyAccountProps & {};

type State = {
  memo: string;
  modified: boolean;
};

class Component extends React.PureComponent<Props, State> {
  state: State = {
    memo: '',
    modified: false
  };

  render () {
    const { myAddress } = this.props;
    const { memo, modified } = this.state;
    return (
      <>
        <MemoEdit accountId={myAddress || ''} onChange={this.onChangeMemo} onReset={this.onResetMemo} />
        <Labelled style={{ marginTop: '.5rem' }}>
          <TxButton
            size='large'
            isDisabled={!modified}
            label='Update memo'
            params={[new Text(memo)]}
            tx='memo.updateMemo'
          />
        </Labelled>
      </>
    );
  }

  onChangeMemo = (memo: string): void => {
    this.setState({ memo, modified: true });
  }

  onResetMemo = (memo: string): void => {
    this.setState({ memo, modified: false });
  }
}

export default withMyAccount(Component);
