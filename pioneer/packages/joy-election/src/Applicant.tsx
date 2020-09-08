import React from 'react';
import { Link } from 'react-router-dom';
import { Table } from 'semantic-ui-react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls } from '@polkadot/react-api/with';
import { AccountId } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import CandidatePreview from './CandidatePreview';

import translate from './translate';
import { calcTotalStake } from '@polkadot/joy-utils/index';
import { ElectionStake } from '@joystream/types/council';

type Props = ApiProps & I18nProps & {
  index: number;
  accountId: AccountId;
  stake?: ElectionStake;
};

class Applicant extends React.PureComponent<Props> {
  render () {
    const { index, accountId, stake } = this.props;
    const voteUrl = `/council/votes?applicantId=${accountId.toString()}`;

    return (
      <Table.Row>
        <Table.Cell>{index + 1}</Table.Cell>
        <Table.Cell>
          <CandidatePreview accountId={accountId}/>
        </Table.Cell>
        <Table.Cell style={{ textAlign: 'right' }}>
          {formatBalance(calcTotalStake(stake))}
        </Table.Cell>
        <Table.Cell>
          <Link to={voteUrl} className='ui button primary inverted'>Vote</Link>
        </Table.Cell>
      </Table.Row>
    );
  }
}

// inject the actual API calls automatically into props
export default translate(
  withCalls<Props>(
    ['query.councilElection.applicantStakes',
      { paramName: 'accountId', propName: 'stake' }]
  )(Applicant)
);
