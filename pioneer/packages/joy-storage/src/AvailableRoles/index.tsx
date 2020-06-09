import React from 'react';
import { BareProps } from '@polkadot/react-components/types';
import { ComponentProps } from '../props';
import { Role, RoleParameters } from '@joystream/types/roles';
import { Option } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import { withCalls } from '@polkadot/react-api/index';
import { Table } from 'semantic-ui-react';
import Section from '@polkadot/joy-utils/Section';
import { formatBalance } from '@polkadot/util';

import BN from 'bn.js';

type Props = BareProps & ComponentProps;

export default class AvailableRoles extends React.PureComponent<Props> {
  render () {
    return (
      <div>{this.props.roles.map((role) =>
        <div key={role.toString()}><RoleDisplay role={role} /></div>)
      }</div>
    );
  }
}

type RoleProps = BareProps & {
  role: Role;
  roleParams?: Option<RoleParameters>;
  actorAccountIds?: Array<AccountId>;
}

class RoleDisplayInner extends React.PureComponent<RoleProps> {
  render () {
    const { role, roleParams, actorAccountIds } = this.props;
    if (!roleParams || roleParams.isNone || !actorAccountIds) return <em>Loading...</em>;

    const params = roleParams.unwrap();

    return (
      <Section title={role.toString()}>
        <Parameters role={role} params={params} active={actorAccountIds.length}></Parameters>
      </Section>
    );
  }
}

const RoleDisplay = withCalls<RoleProps>(
  ['query.actors.parameters', { propName: 'roleParams', paramName: 'role' }],
  ['query.actors.accountIdsByRole', { propName: 'actorAccountIds', paramName: 'role' }]
)(RoleDisplayInner);

type ParamProps = BareProps & {
  role: Role;
  params: RoleParameters;
  active: number;
}

const Parameters = function Parameters (props: ParamProps) {
  const { params, role, active } = props;

  const minStake = formatBalance(new BN(params.min_stake));
  const maxActors = (new BN(params.max_actors)).toString();
  const reward = formatBalance(new BN(params.reward));
  const rewardPeriod = (new BN(params.reward_period)).toString();
  const unbondingPeriod = (new BN(params.unbonding_period)).toString();

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Role Id</Table.HeaderCell>
          <Table.HeaderCell>{role.toNumber()}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Minimum Stake</Table.Cell>
          <Table.Cell>{minStake}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Actors</Table.Cell>
          <Table.Cell>{active}/{maxActors}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Reward</Table.Cell>
          <Table.Cell>{reward}, every {rewardPeriod} blocks</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Unbonding Period</Table.Cell>
          <Table.Cell>{unbondingPeriod} blocks</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  );
};
