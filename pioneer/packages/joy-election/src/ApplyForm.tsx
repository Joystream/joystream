import BN from 'bn.js';
import React from 'react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls, withMulti } from '@polkadot/react-api/hoc';
import { Labelled } from '@polkadot/react-components/index';
import { Balance } from '@polkadot/types/interfaces';

import translate from './translate';
import TxButton from '@polkadot/joy-utils/react/components/TxButton';
import InputStake from '@polkadot/joy-utils/react/components/InputStake';
import { ElectionStake } from '@joystream/types/council';
import { calcTotalStake, ZERO } from '@polkadot/joy-utils/functions/misc';
import { MyAddressProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { withOnlyMembers } from '@polkadot/joy-utils/react/hocs/guards';

type Props = ApiProps & I18nProps & MyAddressProps & {
  minStake?: Balance;
  alreadyStaked?: ElectionStake;
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
        <div style={{ marginTop: '.5rem' }}>
          <Labelled>
            <TxButton
              size='large'
              isDisabled={!isStakeValid}
              label={buttonLabel}
              params={[stake]}
              tx='councilElection.apply'
            />
          </Labelled>
        </div>
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
    const isStakeGteMinStake = stake.add(this.alreadyStaked()).gte(this.minStake());
    const isStakeValid = !stake.isZero() && isStakeGteMinStake;

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
      { paramName: 'myAddress', propName: 'alreadyStaked' }]
  )
);
