import React from 'react'
import { BareProps } from '@polkadot/react-components/types';
import { ComponentProps } from '../props';
import { withCalls } from '@polkadot/react-api/index';
import { Table } from 'semantic-ui-react';
import { Option } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import AddressMini from '@polkadot/react-components/AddressMiniJoy';
import { Actor } from '@joystream/types/roles';
import { MemberId } from '@joystream/types/members';
import { MyAccountProps, withMyAccount } from '@polkadot/joy-utils/MyAccount';
import { queryMembershipToProp } from '@polkadot/joy-members/utils';
import TxButton from '@polkadot/joy-utils/TxButton';

type MemberIdProps = {
  memberIdsByControllerAccountId?: Option<MemberId>,
};

type Props = BareProps & ComponentProps & MyAccountProps & MemberIdProps;

class ActorsList extends React.PureComponent<Props> {
  render() {
    const { actorAccountIds, memberIdsByControllerAccountId } = this.props;

    return (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Member Id</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Actor Account</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{actorAccountIds.map((account: string) =>
          <ActorDisplay key={account} account={account} memberIdsByControllerAccountId={memberIdsByControllerAccountId} />
        )}
        </Table.Body>
      </Table>
    )
  }
}


type ActorProps = BareProps & MemberIdProps & {
  account: string,
  actor?: Option<Actor>
}

class ActorInner extends React.PureComponent<ActorProps> {
  render() {
    const { actor: actorOpt, memberIdsByControllerAccountId: memberIdOpt } = this.props;

    if (!actorOpt || actorOpt.isNone || !memberIdOpt) return null;

    const actor = actorOpt.unwrap();

    const memberId = memberIdOpt.isSome ? memberIdOpt.unwrap() : undefined;
    const memberIsActor = memberId && (memberId.toString() == actor.member_id.toString());

    return (
      <Table.Row>
        <Table.Cell>{actor.member_id.toString()}</Table.Cell>
        <Table.Cell>{actor.role.toString()}</Table.Cell>
        <Table.Cell>
          <AddressMini value={actor.account} isShort={false} isPadded={false} withBalance={true} /></Table.Cell>
        {memberIsActor ? <Table.Cell>{this.renderUnstakeTxButton(actor.account)}</Table.Cell> : null}
      </Table.Row>
    )
  }

  private renderUnstakeTxButton(account: AccountId) {
    return <TxButton tx={'actors.unstake'} params={[account]} label={'Unstake'}
      type='submit' size='large' isDisabled={false} />
  }
}

const ActorDisplay = withCalls<ActorProps>(
  ['query.actors.actorByAccountId', { propName: 'actor', paramName: 'account' }]
)(ActorInner)


const ActionableActorsList = withMyAccount(withCalls<Props>(
  queryMembershipToProp('memberIdsByControllerAccountId', 'myAddress')
)(ActorsList));

export default ActionableActorsList;
