import React from 'react';
import { Bubble, InputAddress, Labelled, Balance, Nonce } from '@polkadot/react-components/index';

type Props = {
  label?: string;
  onChange: (accountId?: string | null) => void;
};

type State = {
  accountId?: string | null;
};

export default class AccountSelector extends React.PureComponent<Props, State> {
  state: State = {};

  render () {
    const { label } = this.props;
    const { accountId } = this.state;

    return <section>
      <InputAddress
        label={ label || 'My account' }
        onChange={this.onChange}
        type='account'
      />
      <Labelled>
        <Bubble label='Balance'>
          <Balance params={accountId} />
        </Bubble>
        <Bubble label='Transactions'>
          <Nonce params={accountId} />
        </Bubble>
      </Labelled>
    </section>;
  }

  private onChange = (accountId: string | null): void => {
    const { onChange } = this.props;
    this.setState({ accountId }, () => onChange(accountId));
  }
}
