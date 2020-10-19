import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Message } from 'semantic-ui-react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls } from '@polkadot/react-api/hoc';
import { Hash } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';

import translate from './translate';
import { calcTotalStake } from '@joystream/js/lib/functions/misc';
import { SealedVote } from '@joystream/types/council';
import AddressMini from '@polkadot/react-components/AddressMini';
import CandidatePreview from './CandidatePreview';
import { findVoteByHash } from './myVotesStore';

type Props = ApiProps & I18nProps & {
  hash: Hash;
  sealedVote?: SealedVote;
  isStageRevealing: boolean;
  isMyVote: boolean;
};

class Comp extends React.PureComponent<Props> {
  renderCandidateOrAction () {
    const { hash, sealedVote, isStageRevealing, isMyVote } = this.props;

    if (!sealedVote) {
      return <em>Unknown hashed vote: {hash.toHex()}</em>;
    }

    if (sealedVote.vote.isSome) {
      const candidateId = sealedVote.vote.unwrap();

      return <CandidatePreview accountId={candidateId} />;
    } else if (isStageRevealing && isMyVote) {
      const revealUrl = `/council/reveals?hashedVote=${hash.toHex()}`;

      return <Link to={revealUrl} className='ui button primary inverted'>Reveal this vote</Link>;
    } else if (isMyVote) {
      return <Message warning>Wait until <i><b>Revealing</b></i> stage in order to reveal this vote.</Message>;
    } else {
      return <Message info>This vote has not been revealed yet.</Message>;
    }
  }

  render () {
    const { hash, sealedVote } = this.props;
    const myVote = findVoteByHash(hash.toHex());

    return !sealedVote ? null : (
      <Table celled selectable compact definition className='SealedVoteTable'>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Hash</Table.Cell>
            <Table.Cell><code>{hash.toHex()}</code></Table.Cell>
          </Table.Row>
          {myVote && <Table.Row>
            <Table.Cell>Salt</Table.Cell>
            <Table.Cell><code>{myVote.salt}</code></Table.Cell>
          </Table.Row>}
          <Table.Row>
            <Table.Cell>Stake</Table.Cell>
            <Table.Cell>{formatBalance(calcTotalStake(sealedVote.stake))}</Table.Cell>
          </Table.Row>
          {myVote && <Table.Row>
            <Table.Cell>Voted on</Table.Cell>
            <Table.Cell>{new Date(myVote.votedOnTime).toLocaleString()}</Table.Cell>
          </Table.Row>}
          <Table.Row>
            <Table.Cell>Voter</Table.Cell>
            <Table.Cell><AddressMini value={sealedVote.voter} isShort={false} isPadded={false} withBalance={true} /></Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Candidate</Table.Cell>
            <Table.Cell>{this.renderCandidateOrAction()}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
  }
}

// inject the actual API calls automatically into props
export default translate(
  withCalls<Props>(
    ['query.councilElection.votes',
      { paramName: 'hash', propName: 'sealedVote' }]
  )(Comp)
);
