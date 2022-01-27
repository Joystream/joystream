import BN from 'bn.js';
import { randomAsHex } from '@polkadot/util-crypto';

import React from 'react';
import { Message, Table } from 'semantic-ui-react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls, withMulti } from '@polkadot/react-api/hoc';
import { AccountId, Balance } from '@polkadot/types/interfaces';
import { Button, Input, Labelled } from '@polkadot/react-components/index';
import { SubmittableResult } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';

import translate from './translate';
import { hashVote } from './utils';
import { queryToProp, ZERO, getUrlParam, nonEmptyStr } from '@polkadot/joy-utils/functions/misc';
import TxButton from '@polkadot/joy-utils/react/components/TxButton';
import InputStake from '@polkadot/joy-utils/react/components/InputStake';
import CandidatePreview from './CandidatePreview';
import { MyAccountProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { withOnlyMembers } from '@polkadot/joy-utils/react/hocs/guards';
import MembersDropdown from '@polkadot/joy-utils/react/components/MembersDropdown';
import { saveVote, NewVote } from './myVotesStore';
import { TxFailedCallback } from '@polkadot/react-components/Status/types';
import { RouteProps } from 'react-router-dom';

function randomSalt () {
  return randomAsHex();
}

// AppsProps is needed to get a location from the route.
type Props = RouteProps & ApiProps & I18nProps & MyAccountProps & {
  applicantId?: string | null;
  minVotingStake?: Balance;
  applicants?: AccountId[];
};

type State = {
  applicantId?: string | null;
  stake?: BN;
  salt?: string;
  isStakeValid?: boolean;
  isFormSubmitted: boolean;
};

class Component extends React.PureComponent<Props, State> {
  constructor (props: Props) {
    super(props);

    let { applicantId, location } = this.props;

    applicantId = applicantId || (location && getUrlParam(location, 'applicantId'));

    this.state = {
      applicantId,
      stake: ZERO,
      salt: randomSalt(),
      isFormSubmitted: false
    };
  }

  render () {
    const { myAddress } = this.props;
    const { applicantId, stake, salt, isStakeValid, isFormSubmitted } = this.state;
    const isFormValid = nonEmptyStr(applicantId) && isStakeValid;
    const hashedVote = hashVote(applicantId, salt);

    const buildNewVote = (): Partial<NewVote> => ({
      voterId: myAddress,
      applicantId: applicantId || undefined,
      stake: (stake || ZERO).toString(),
      salt: salt,
      hash: hashedVote || undefined
    });

    return (
      <>{isFormSubmitted

      // Summary of submitted vote:
        ? <div>
          <Message info>
          Your vote has been sent
          </Message>
          <Table celled selectable compact definition className='SealedVoteTable'>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Applicant</Table.Cell>
                <Table.Cell>
                  { applicantId && <CandidatePreview accountId={applicantId}/> }
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Stake</Table.Cell>
                <Table.Cell>{formatBalance(stake)}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Salt</Table.Cell>
                <Table.Cell><code>{salt}</code></Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Hashed vote</Table.Cell>
                <Table.Cell><code>{hashedVote}</code></Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
          <Button
            label='Submit another vote'
            onClick={this.resetForm}
            icon='arrow-left'
          />
        </div>

      // New vote form:
        : <div>
          <div className='ui--row'>
            <MembersDropdown
              onChange={ (event, data) => this.onChangeApplicant(data.value as string) }
              accounts={this.props.applicants || []}
              value={applicantId || ''}
              placeholder='Select an applicant you support'
            />
          </div>
          <InputStake
            min={this.minStake()}
            isValid={isStakeValid}
            onChange={this.onChangeStake}
          />
          <div className='ui--row'>
            <Input
              className='large'
              isDisabled={true}
              label='Random salt:'
              value={salt}
              onChange={this.onChangeSalt}
            />
            <div className='medium' style={{ margin: '.5rem' }}>
              <Button onClick={this.newRandomSalt} icon='cubes' label='Generate' />
              <Message compact warning size='tiny' content='You need to remember this salt!' />
            </div>
          </div>
          <div className='ui--row'>
            <Input
              isDisabled={true}
              label='Hashed vote:'
              value={hashedVote}
            />
          </div>
          <div style={{ marginTop: '.5rem' }}>
            <Labelled>
              <TxButton
                isDisabled={!isFormValid}
                label='Submit my vote'
                params={[hashedVote, stake]}
                tx='councilElection.vote'
                txStartCb={this.onFormSubmitted}
                txFailedCb={this.onTxFailed}
                txSuccessCb={(txResult: SubmittableResult) => this.onTxSuccess(buildNewVote() as NewVote, txResult)}
              />
            </Labelled>
          </div>
        </div>}
      </>
    );
  }

  private resetForm = (): void => {
    this.onChangeStake(ZERO);
    this.newRandomSalt();
    this.setState({ isFormSubmitted: false });
  }

  private onFormSubmitted = (): void => {
    this.setState({ isFormSubmitted: true });
  }

  private onTxFailed: TxFailedCallback = (_txResult: SubmittableResult | Error | null): void => {
    // TODO Possible UX improvement: tell a user that his vote hasn't been accepted.
  }

  private onTxSuccess = (vote: NewVote, txResult: SubmittableResult): void => {
    let hasVotedEvent = false;

    txResult.events.forEach((event, i) => {
      const { section, method } = event.event;

      if (section === 'councilElection' && method === 'Voted') {
        hasVotedEvent = true;
      }
    });

    if (hasVotedEvent) {
      saveVote(vote);
      this.setState({ isFormSubmitted: true });
    }
  }

  private newRandomSalt = (): void => {
    this.setState({ salt: randomSalt() });
  }

  private minStake = (): BN => {
    return this.props.minVotingStake || new BN(1);
  }

  private onChangeStake = (stake?: BN) => {
    const isStakeValid = stake && stake.gte(this.minStake());

    this.setState({ stake, isStakeValid });
  }

  private onChangeApplicant = (applicantId?: string | null) => {
    this.setState({ applicantId });
  }

  private onChangeSalt = (salt?: string) => {
    // TODO check that salt is unique by checking Substrate store.
    this.setState({ salt });
  }
}

export default withMulti(
  Component,
  translate,
  withOnlyMembers,
  withCalls<Props>(
    queryToProp('query.councilElection.minVotingStake'),
    queryToProp('query.councilElection.applicants')
  )
);
