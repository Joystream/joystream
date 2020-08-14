import BN from 'bn.js';
import React from 'react';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls } from '@polkadot/react-api/hoc';
import { Option } from '@polkadot/types';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';
import { Label, Icon } from 'semantic-ui-react';
import { formatNumber, formatBalance } from '@polkadot/util';

import Section from '@polkadot/joy-utils/react/components/Section';
import { queryToProp } from '@polkadot/joy-utils/functions/misc';
import { ElectionStage, Seat } from '@joystream/types/council';
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
      <Label.Group color="grey" size="large">
        <Label>
          Council members
          <Label.Detail>{activeCouncil.length}</Label.Detail>
        </Label>
        <Label>
          <Icon name="flag checkered"/>
          Term ends at block #
          <Label.Detail>{formatNumber(p.termEndsAt)}</Label.Detail>
        </Label>
      </Label.Group>
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
      <Label.Group color="grey" size="large">
        <Label>
          <Icon name="target"/>
          Election round #
          <Label.Detail>{formatNumber(round)}</Label.Detail>
        </Label>
        {isRunning && <>
          <Label>
            Stage
            <Label.Detail>{stageName}</Label.Detail>
          </Label>
          <Label>
            Blocks left
            <Label.Detail>{formatNumber(leftBlocks)}</Label.Detail>
          </Label>
          <Label>
            <Icon name="flag checkered"/>
            Stage ends at block #
            <Label.Detail>{formatNumber(stageEndsAt)}</Label.Detail>
          </Label>
        </>}
      </Label.Group>
    </Section>;
  }

  renderConfig () {
    const p = this.props;
    const isAutoStart = (p.autoStart || false).valueOf();

    return <Section title='Configuration'>
      <Label.Group color="grey" size="large">
        <Label>
          Auto-start elections
          <Label.Detail>{isAutoStart ? 'Yes' : 'No'}</Label.Detail>
        </Label>
        <Label>
          New term duration
          <Label.Detail>{formatNumber(p.newTermDuration)}</Label.Detail>
        </Label>
        <Label>
          Candidacy limit
          <Label.Detail>{formatNumber(p.candidacyLimit)}</Label.Detail>
        </Label>
        <Label>
          Council size
          <Label.Detail>{formatNumber(p.councilSize)}</Label.Detail>
        </Label>
        <Label>
          Min. council stake
          <Label.Detail>{formatBalance(p.minCouncilStake)}</Label.Detail>
        </Label>
        <Label>
          Min. voting stake
          <Label.Detail>{formatBalance(p.minVotingStake)}</Label.Detail>
        </Label>
      </Label.Group>
      <Label.Group color="grey" size="large">
        <Label>
          Announcing period
          <Label.Detail>{formatNumber(p.announcingPeriod)} blocks</Label.Detail>
        </Label>
        <Label>
          Voting period
          <Label.Detail>{formatNumber(p.votingPeriod)} blocks</Label.Detail>
        </Label>
        <Label>
          Revealing period
          <Label.Detail>{formatNumber(p.revealingPeriod)} blocks</Label.Detail>
        </Label>
      </Label.Group>
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
