import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Message } from 'semantic-ui-react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls } from '@polkadot/react-api/hoc';
import { Hash } from '@polkadot/types/interfaces';

import translate from './translate';
import SealedVote from './SealedVote';
import { queryToProp } from '@polkadot/joy-utils/functions/misc';
import { MyAddressProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { SavedVote } from './myVotesStore';
import Section from '@polkadot/joy-utils/react/components/Section';

type Props = ApiProps & I18nProps & MyAddressProps & {
  myVotes?: SavedVote[];
  commitments?: Hash[];
  isStageRevealing: boolean;
};

class Comp extends React.PureComponent<Props> {
  private filterVotes = (myVotesOnly: boolean): Hash[] => {
    const { myVotes = [], commitments = [] } = this.props;

    const isMyVote = (hash: string): boolean => {
      return myVotes.find((x) => x.hash === hash) !== undefined;
    };

    return commitments.filter((x) => myVotesOnly === isMyVote(x.toHex()));
  }

  private renderVotes = (votes: Hash[], areVotesMine: boolean) => {
    return votes.map((hash, index) =>
      <SealedVote
        key={index}
        hash={hash}
        isStageRevealing={this.props.isStageRevealing}
        isMyVote={areVotesMine}/>
    );
  }

  render () {
    const myVotes = this.filterVotes(true);
    const otherVotes = this.filterVotes(false);

    return <>
      <Section title={`My previous votes (${myVotes.length})`}>
        {
          !myVotes.length
            ? <Message info>No votes by the current account found on the current browser.</Message>
            : this.renderVotes(myVotes, true)
        }
        { this.props.isStageRevealing && <Button primary as={Link} to='reveals'>Reveal other vote</Button> }
      </Section>
      <Section title={`Other votes (${otherVotes.length})`}>
        {
          !otherVotes.length
            ? <em>No votes submitted by other accounts yet.</em>
            : this.renderVotes(otherVotes, false)
        }
      </Section>
    </>;
  }
}

// inject the actual API calls automatically into props
export default translate(
  withCalls<Props>(
    queryToProp('query.councilElection.commitments')
  )(Comp)
);
