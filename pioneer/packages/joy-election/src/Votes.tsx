import React from 'react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls } from '@polkadot/react-api/hoc';
import { Message } from 'semantic-ui-react';
import { Option } from '@polkadot/types';

import translate from './translate';
import SealedVotes from './SealedVotes';
import Section from '@polkadot/joy-utils/react/components/Section';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { getVotesByVoter } from './myVotesStore';
import VoteForm from './VoteForm';
import { queryToProp } from '@polkadot/joy-utils/react/helpers';
import { ElectionStage } from '@joystream/types/src/council';
import { RouteProps } from 'react-router-dom';

type Props = RouteProps & ApiProps & I18nProps & MyAccountProps & {
  stage?: Option<ElectionStage>;
};

class Component extends React.PureComponent<Props> {
  render () {
    const { myAddress, stage } = this.props;
    const myVotes = myAddress ? getVotesByVoter(myAddress) : [];

    return <>
      <Section title='My vote'>
        { stage?.unwrapOr(undefined)?.isOfType('Voting')
          ? (
            <VoteForm {...this.props} myAddress={myAddress} />
          )
          : (
            <Message warning>
              Voting is only possible during <i><b>Voting</b></i> stage.
            </Message>
          )
        }
      </Section>
      <SealedVotes
        isStageRevealing={stage?.unwrapOr(undefined)?.isOfType('Revealing') || false}
        myAddress={myAddress}
        myVotes={myVotes} />
    </>;
  }
}

export default translate(
  withCalls<Props>(
    queryToProp('query.councilElection.stage')
  )(withMyAccount(Component))
);
