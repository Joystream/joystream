import BN from 'bn.js';
import React from 'react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import { Labelled } from '@polkadot/react-components/index';
import { Balance } from '@polkadot/types/interfaces';

import translate from './translate';
import TxButton from '@polkadot/joy-utils/TxButton';
import InputStake from '@polkadot/joy-utils/InputStake';
import { ElectionStake } from '@joystream/types/council';
import { calcTotalStake, ZERO } from '@polkadot/joy-utils/index';
import { MyAddressProps, withOnlyMembers } from '@polkadot/joy-utils/MyAccount';

type Props = ApiProps & I18nProps & MyAddressProps & {
  minStake?: Balance;
  alreadyStaked?: ElectionStake;
  myBalance?: Balance;
};

type State = {
  stake: BN;
  isStakeValid: boolean;
};

const DEFAULT_STATE: State = {
  stake: ZERO,
  isStakeValid: false
};

class ApplyForm extends React.PureComponent<Props, State> {
  state = DEFAULT_STATE;

  render () {
    const { stake, isStakeValid } = this.state;
    const hasAlreadyStakedEnough = this.alreadyStaked().gte(this.minStake());
    const minStake = hasAlreadyStakedEnough ? ZERO : this.minStake();
    const buttonLabel = hasAlreadyStakedEnough
      ? 'Add to my stake'
      : 'Apply to council';

    return (
      <div>
        <InputStake
          min={minStake}
          isValid={isStakeValid}
          onChange={this.onChangeStake}
        />
        <Labelled style={{ marginTop: '.5rem' }}>
          <TxButton
            size='large'
            isDisabled={!isStakeValid}
            label={buttonLabel}
            params={[stake]}
            tx='councilElection.apply'
          />
        </Labelled>
      </div>
    );
  }

  private alreadyStaked = (): BN => {
    return calcTotalStake(this.props.alreadyStaked);
  }

  private minStake = (): BN => {
    return this.props.minStake || new BN(1);
  }

  private onChangeStake = (stake?: BN): void => {
    stake = stake || ZERO;
    const { myBalance = ZERO } = this.props;
    const isStakeLteBalance = stake.lte(myBalance);
    const isStakeGteMinStake = stake.add(this.alreadyStaked()).gte(this.minStake());
    const isStakeValid = !stake.isZero() && isStakeGteMinStake && isStakeLteBalance;
    this.setState({ stake, isStakeValid });
  }
}

// inject the actual API calls automatically into props
export default withMulti(
  ApplyForm,
  translate,
  withOnlyMembers,
  withCalls<Props>(
    ['query.councilElection.minCouncilStake',
      { propName: 'minStake' }],
    ['query.councilElection.applicantStakes',
      { paramName: 'myAddress', propName: 'alreadyStaked' }],
    ['query.balances.freeBalance',
      { paramName: 'myAddress', propName: 'myBalance' }]
  )
);
