import BN from 'bn.js';
import React from 'react';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls } from '@polkadot/react-api/with';
import { Option } from '@polkadot/types';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';
import { Bubble } from '@polkadot/react-components/index';
import { formatNumber, formatBalance } from '@polkadot/util';

import Section from '@polkadot/joy-utils/Section';
import { queryToProp } from '@polkadot/joy-utils/index';
import { ElectionStage, Seat } from '@joystream/types/';
import translate from './translate';

type Props = ApiProps & I18nProps & {
  bestNumber?: BN;

  activeCouncil?: Seat[];
  termEndsAt?: BlockNumber;

  autoStart?: boolean;
  newTermDuration?: BN;
  candidacyLimit?: BN;
  councilSize?: BN;
  minCouncilStake?: Balance;
  minVotingStake?: Balance;
  announcingPeriod?: BlockNumber;
  votingPeriod?: BlockNumber;
  revealingPeriod?: BlockNumber;

  round?: BN;
  stage?: Option<ElectionStage>;
};

type State = {};

class Dashboard extends React.PureComponent<Props, State> {
  state: State = {};

  renderCouncil () {
    const p = this.props;
    const { activeCouncil = [] } = p;
    const title = `Council ${activeCouncil.length > 0 ? '' : '(not elected)'}`;

    return <Section title={title}>
      <Bubble label='Council members'>
        {activeCouncil.length}
      </Bubble>
      <Bubble icon='flag checkered' label='Term ends at block #'>
        {formatNumber(p.termEndsAt)}
      </Bubble>
    </Section>;
  }

  renderElection () {
    const { bestNumber, round, stage } = this.props;

    let stageName: string | undefined;
    let stageEndsAt: BlockNumber | undefined;
    if (stage && stage.isSome) {
      const stageValue = stage.value as ElectionStage;
      stageEndsAt = stageValue.value as BlockNumber; // contained value
      stageName = stageValue.type; // name of Enum variant
    }

    let leftBlocks: BN | undefined;
    if (stageEndsAt && bestNumber) {
      leftBlocks = stageEndsAt.sub(bestNumber);
    }

    const isRunning: boolean = stage !== undefined && stage.isSome;
    const stateClass = `JoyElection--${isRunning ? '' : 'Not'}Running`;
    const stateText = `is ${isRunning ? '' : 'not'} running`;
    const title = <>Election (<span className={stateClass}>{stateText}</span>)</>;

    return <Section title={title}>
      <Bubble icon='target' label='Election round #'>
        {formatNumber(round)}
      </Bubble>
      {isRunning && <>
        <Bubble label='Stage'>
          {stageName}
        </Bubble>
        <Bubble label='Blocks left'>
          {formatNumber(leftBlocks)}
        </Bubble>
        <Bubble icon='flag checkered' label='Stage ends at block #'>
          {formatNumber(stageEndsAt)}
        </Bubble>
      </>}
    </Section>;
  }

  renderConfig () {
    const p = this.props;
    const isAutoStart = (p.autoStart || false).valueOf();

    return <Section title='Configuration'>
      <Bubble label='Auto-start elections'>
        {isAutoStart ? 'Yes' : 'No'}
      </Bubble>
      <Bubble label='New term duration'>
        {formatNumber(p.newTermDuration)}
      </Bubble>
      <Bubble label='Candidacy limit'>
        {formatNumber(p.candidacyLimit)}
      </Bubble>
      <Bubble label='Council size'>
        {formatNumber(p.councilSize)}
      </Bubble>
      <Bubble label='Min. council stake'>
        {formatBalance(p.minCouncilStake)}
      </Bubble>
      <Bubble label='Min. voting stake'>
        {formatBalance(p.minVotingStake)}
      </Bubble>
      <Bubble label='Announcing period'>
        {formatNumber(p.announcingPeriod)} blocks
      </Bubble>
      <Bubble label='Voting period'>
        {formatNumber(p.votingPeriod)} blocks
      </Bubble>
      <Bubble label='Revealing period'>
        {formatNumber(p.revealingPeriod)} blocks
      </Bubble>
    </Section>;
  }

  render () {
    return (
      <div className='JoySections'>
        {this.renderCouncil()}
        {this.renderElection()}
        {this.renderConfig()}
      </div>
    );
  }
}

// inject the actual API calls automatically into props
export default translate(
  withCalls<Props>(
    queryToProp('derive.chain.bestNumber'),

    queryToProp('query.council.activeCouncil'),
    queryToProp('query.council.termEndsAt'),

    queryToProp('query.councilElection.autoStart'),
    queryToProp('query.councilElection.newTermDuration'),
    queryToProp('query.councilElection.candidacyLimit'),
    queryToProp('query.councilElection.councilSize'),

    queryToProp('query.councilElection.minCouncilStake'),
    queryToProp('query.councilElection.minVotingStake'),

    queryToProp('query.councilElection.announcingPeriod'),
    queryToProp('query.councilElection.votingPeriod'),
    queryToProp('query.councilElection.revealingPeriod'),

    queryToProp('query.councilElection.stage'),
    queryToProp('query.councilElection.round')
  )(Dashboard)
);
