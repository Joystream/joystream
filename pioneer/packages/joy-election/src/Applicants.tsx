import React from 'react';
import { Table, Message } from 'semantic-ui-react';
import BN from 'bn.js';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls } from '@polkadot/react-api/hoc';
import { AccountId } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types';
import { formatNumber } from '@polkadot/util';

import translate from './translate';
import Applicant from './Applicant';
import ApplyForm from './ApplyForm';
import Section from '@polkadot/joy-utils/react/components/Section';
import { queryToProp } from '@polkadot/joy-utils/react/helpers';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { ElectionStage } from '@joystream/types/src/council';
import { RouteProps } from 'react-router-dom';

type Props = RouteProps & ApiProps & I18nProps & MyAccountProps & {
  candidacyLimit?: BN;
  applicants?: Array<AccountId>;
  stage?: Option<ElectionStage>;
};

class Applicants extends React.PureComponent<Props> {
  private renderTable = (applicants: Array<AccountId>) => {
    const isVotingStage = this.props.stage?.unwrapOr(undefined)?.isOfType('Voting') || false;

    return (
      <Table celled selectable compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>#</Table.HeaderCell>
            <Table.HeaderCell>Applicant</Table.HeaderCell>
            <Table.HeaderCell>Total stake</Table.HeaderCell>
            { isVotingStage && (
              <Table.HeaderCell style={{ width: '1%' }}>Actions</Table.HeaderCell>
            ) }
          </Table.Row>
        </Table.Header>
        <Table.Body>{applicants.map((accountId, index) => (
          <Applicant key={index} index={index} accountId={accountId} isVotingStage={isVotingStage}/>
        ))}</Table.Body>
      </Table>
    );
  }

  render () {
    const { myAddress, applicants = [], candidacyLimit = new BN(0), stage } = this.props;
    const title = <span>Applicants <sup>{applicants.length}/{formatNumber(candidacyLimit)}</sup></span>;

    return <>
      <Section title='My application'>
        { stage?.unwrapOr(undefined)?.isOfType('Announcing')
          ? (
            <ApplyForm myAddress={myAddress} />
          )
          : (
            <Message warning>
              Applying to council is only possible during <i><b>Announcing</b></i> stage.
            </Message>
          )
        }
      </Section>
      <Section title={title}>
        {!applicants.length
          ? <em>No applicants yet</em>
          : this.renderTable(applicants)
        }
      </Section>
    </>;
  }
}

// inject the actual API calls automatically into props
export default translate(
  withCalls<Props>(
    queryToProp('query.councilElection.candidacyLimit'),
    queryToProp('query.councilElection.applicants'),
    queryToProp('query.councilElection.stage')
  )(withMyAccount(Applicants))
);
