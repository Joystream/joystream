import React from 'react';
import BN from 'bn.js';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls } from '@polkadot/react-api/hoc';
import { Label } from 'semantic-ui-react';
import { formatNumber } from '@polkadot/util';
import { bool as Bool } from '@polkadot/types';

import { Section } from '@polkadot/joy-utils/react/components';
import translate from './translate';
import { queryMembershipToProp } from './utils';

import { FIRST_MEMBER_ID } from './constants';

type Props = ApiProps & I18nProps & {
  newMembershipsAllowed?: Bool;
  nextMemberId?: BN;
  minHandleLength?: BN;
  maxHandleLength?: BN;
  maxAvatarUriLength?: BN;
  maxAboutTextLength?: BN;
};

class Dashboard extends React.PureComponent<Props> {
  renderGeneral () {
    const p = this.props;
    const { newMembershipsAllowed: isAllowed } = p;
    let isAllowedColor: 'grey' | 'green' | 'red' = 'grey';

    if (isAllowed) {
      isAllowedColor = isAllowed.eq(true) ? 'green' : 'red';
    }

    return (
      <Section title='General'>
        <Label.Group size='large'>
          <Label color={isAllowedColor}>
            New memberships allowed?
            <Label.Detail>{isAllowed && (isAllowed.eq(true) ? 'Yes' : 'No')}</Label.Detail>
          </Label>
          <Label color='grey'>
            Next member ID
            <Label.Detail>{formatNumber(p.nextMemberId)}</Label.Detail>
          </Label>
          <Label color='grey'>
            First member ID
            <Label.Detail>{formatNumber(FIRST_MEMBER_ID)}</Label.Detail>
          </Label>
        </Label.Group>
      </Section>
    );
  }

  renderValidation () {
    const p = this.props;

    return (
      <Section title='Validation'>
        <Label.Group color='grey' size='large'>
          <Label>
            Min. length of handle
            <Label.Detail>{formatNumber(p.minHandleLength)} chars</Label.Detail>
          </Label>
          <Label>
            Max. length of handle
            <Label.Detail>{formatNumber(p.maxHandleLength)} chars</Label.Detail>
          </Label>
          <Label>
            Max. length of avatar URI
            <Label.Detail>{formatNumber(p.maxAvatarUriLength)} chars</Label.Detail>
          </Label>
          <Label>
            Max. length of about
            <Label.Detail>{formatNumber(p.maxAboutTextLength)} chars</Label.Detail>
          </Label>
        </Label.Group>
      </Section>
    );
  }

  render () {
    return (
      <div className='JoySections'>
        {this.renderGeneral()}
        {this.renderValidation()}
      </div>
    );
  }
}

export default translate(
  withCalls<Props>(
    queryMembershipToProp('newMembershipsAllowed'),
    queryMembershipToProp('nextMemberId'),
    queryMembershipToProp('minHandleLength'),
    queryMembershipToProp('maxHandleLength'),
    queryMembershipToProp('maxAvatarUriLength'),
    queryMembershipToProp('maxAboutTextLength')
  )(Dashboard)
);
