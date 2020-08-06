import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Loader } from 'semantic-ui-react';
import ReactMarkdown from 'react-markdown';
import { IdentityIcon } from '@polkadot/react-components';
import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls } from '@polkadot/react-api/with';
import { Option } from '@polkadot/types';
import BalanceDisplay from '@polkadot/react-components/Balance';
import AddressMini from '@polkadot/react-components/AddressMiniJoy';
import { formatNumber } from '@polkadot/util';

import translate from './translate';
import { MemberId, Membership, EntryMethod, Paid, Screening, Genesis, SubscriptionId } from '@joystream/types/members';
import { queryMembershipToProp } from './utils';
import { Seat } from '@joystream/types/council';
import { nonEmptyStr, queryToProp } from '@polkadot/joy-utils/index';
import { MyAccountProps, withMyAccount } from '@polkadot/joy-utils/MyAccount';

type Props = ApiProps & I18nProps & MyAccountProps & {
  preview?: boolean;
  memberId: MemberId;
  membership?: Membership;
  activeCouncil?: Seat[];
};

class Component extends React.PureComponent<Props> {
  render () {
    const { membership } = this.props;
    return membership && !membership.handle.isEmpty
      ? this.renderProfile(membership)
      : (
        <div className={'item ProfileDetails'}>
          <Loader active inline/>
        </div>
      );
  }

  private renderProfile (membership: Membership) {
    const {
      preview = false,
      myAddress,
      activeCouncil = []
    } = this.props;

    const {
      handle,
      avatar_uri,
      root_account,
      controller_account
    } = membership;

    const hasAvatar = avatar_uri && nonEmptyStr(avatar_uri.toString());
    const isMyProfile = myAddress && (myAddress === root_account.toString() || myAddress === controller_account.toString());
    const isCouncilor: boolean = (
      (activeCouncil.find(x => root_account.eq(x.member)) !== undefined) ||
      (activeCouncil.find(x => controller_account.eq(x.member)) !== undefined)
    );

    return (
      <>
      <div className={`item ProfileDetails ${isMyProfile && 'MyProfile'}`}>
        {hasAvatar
          ? <img className='ui avatar image' src={avatar_uri.toString()} />
          : <IdentityIcon className='image' value={root_account} size={40} />
        }
        <div className='content'>
          <div className='header'>
            <Link to={`/members/${handle.toString()}`} className='handle'>{handle.toString()}</Link>
            {isMyProfile && <Link to={'/members/edit'} className='ui tiny button'>Edit my profile</Link>}
          </div>
          <div className='description'>
            {isCouncilor &&
              <b className='muted text' style={{ color: '#607d8b' }}>
                <i className='university icon'></i>
                Council member
              </b>}
            <BalanceDisplay label='Balance(root): ' params={root_account} />
            <div>MemberId: {this.props.memberId.toString()}</div>
          </div>
        </div>
      </div>
      {!preview && this.renderDetails(membership, isCouncilor)}
      </>
    );
  }

  private renderDetails (membership: Membership, isCouncilor: boolean) {
    const {
      about,
      registered_at_block,
      registered_at_time,
      entry,
      suspended,
      subscription,
      root_account,
      controller_account

    } = membership;

    const { memberId } = this.props;

    return (
      <Table celled selectable compact definition className='ProfileDetailsTable'>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Membership ID</Table.Cell>
            <Table.Cell>{memberId.toNumber()}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Root account</Table.Cell>
            <Table.Cell><AddressMini value={root_account} isShort={false} isPadded={false} withBalance /></Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Controller account</Table.Cell>
            <Table.Cell><AddressMini value={controller_account} isShort={false} isPadded={false} withBalance /></Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Registered on</Table.Cell>
            <Table.Cell>{new Date(registered_at_time.toNumber()).toLocaleString()} at block #{formatNumber(registered_at_block)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Suspended?</Table.Cell>
            <Table.Cell>{suspended.eq(true) ? 'Yes' : 'No'}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Council member?</Table.Cell>
            <Table.Cell>{isCouncilor ? 'Yes' : 'No'}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Entry method</Table.Cell>
            <Table.Cell>{this.renderEntryMethod(entry)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Subscription ID</Table.Cell>
            <Table.Cell>{this.renderSubscription(subscription)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>About</Table.Cell>
            <Table.Cell><ReactMarkdown className='JoyMemo--full' source={about.toString()} linkTarget='_blank' /></Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
  }

  private renderEntryMethod (entry: EntryMethod) {
    const etype = entry.type;
    if (etype === Paid.name) {
      const paid = entry.value as Paid;
      return <div>Paid, terms ID: {paid.toNumber()}</div>;
    } else if (etype === Screening.name) {
      const accountId = entry.value as Screening;
      return <div>Screened by <AddressMini value={accountId} isShort={false} isPadded={false} withBalance /></div>;
    } else if (etype === Genesis.name) {
      return <div>Created at Genesis</div>;
    } else {
      return <em className='muted text'>Unknown</em>;
    }
  }

  private renderSubscription (subscription: Option<SubscriptionId>) {
    return subscription.isNone
      ? <em className='muted text'>No subscription yet.</em>
      : subscription.value.toString();
  }
}

export default translate(withMyAccount(
  withCalls<Props>(
    queryToProp('query.council.activeCouncil'),
    queryMembershipToProp(
      'membershipById',
      { paramName: 'memberId', propName: 'membership' }
    )
  )(Component)
));
