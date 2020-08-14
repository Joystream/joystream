import BN from 'bn.js';
import React from 'react';
import { InputBalance } from '@polkadot/react-components/index';
import { Label } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';

type Props = {
  label?: string;
  min?: BN;
  isValid?: boolean;
  onChange: (stake?: BN) => void;
};

export default class Component extends React.PureComponent<Props> {
  render () {
    const { min, label, isValid, onChange } = this.props;

    return (
      <div className='ui--row' style={{ display: 'flex' }}>
        <InputBalance
          className='medium'
          label={label || 'Amount to be staked:'}
          onChange={onChange}
        />
        {min && !min.isZero() && (
          <div
            className='medium'
            style={{
              marginLeft: '.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
            <Label
              color={ isValid ? 'green' : 'red' }
              icon={isValid ? 'check' : 'warning sign'}
              label='Minimum stake'
              pointing='left'
            >
              Minimum stake
              <Label.Detail>{formatBalance(min)}</Label.Detail>
            </Label>
          </div>
        ) }
      </div>
    );
  }
}
