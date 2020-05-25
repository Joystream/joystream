import React from 'react'
import { BareProps } from '@polkadot/react-components/types';
import { ComponentProps } from '../props';
import { withCalls } from '@polkadot/react-api/index';
import { Table } from 'semantic-ui-react';
import { Option } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import AddressMini from '@polkadot/react-components/AddressMiniJoy';
import { Actor } from '@joystream/types/roles';
import { MyAccountProps, withMyAccount } from '@polkadot/joy-utils/MyAccount';
import TxButton from '@polkadot/joy-utils/TxButton';

type Props = BareProps & ComponentProps & MyAccountProps;

class ActorsList extends React.PureComponent<Props> {
  render() {
    const { actorAccountIds, myMemberId, iAmMember} = this.props;

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
        <Table.Body>{actorAccountIds.map((actor_account: string) =>
          <ActorDisplay key={actor_account} actor_account={actor_account} myMemberId={myMemberId} iAmMember={iAmMember} />
        )}
        </Table.Body>
      </Table>
    )
  }
}


type ActorProps = MyAccountProps & {
  actor_account: string,
  actor?: Option<Actor>,
}

class ActorInner extends React.PureComponent<ActorProps> {
  render() {
    const { actor: actorOpt, iAmMember, myMemberId } = this.props;

    if (!actorOpt || actorOpt.isNone) return null;

    const actor = actorOpt.unwrap();
    const memberIsActor = iAmMember && myMemberId
                            && (myMemberId.toString() == actor.member_id.toString());

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
  ['query.actors.actorByAccountId', { propName: 'actor', paramName: 'actor_account' }]
)(ActorInner)


const ActionableActorsList = withMyAccount(ActorsList);

export default ActionableActorsList;
