import React from 'react';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import { AccountId } from '@polkadot/types/interfaces';
import { Input, Labelled, InputAddress } from '@polkadot/react-components/index';

import translate from './translate';
import { nonEmptyStr, queryToProp, getUrlParam } from '@polkadot/joy-utils/index';
import { accountIdsToOptions, hashVote } from './utils';
import TxButton from '@polkadot/joy-utils/TxButton';
import { findVoteByHash } from './myVotesStore';
import { withOnlyMembers } from '@polkadot/joy-utils/MyAccount';

// AppsProps is needed to get a location from the route.
type Props = AppProps & ApiProps & I18nProps & {
  applicantId?: string | null;
  applicants?: AccountId[];
  location: any;
};

type State = {
  applicantId?: string | null,
  salt?: string,
  hashedVote?: string | null
};

class RevealVoteForm extends React.PureComponent<Props, State> {

  constructor (props: Props) {
    super(props);
    let { applicantId, location } = this.props;
    applicantId = applicantId ? applicantId : getUrlParam(location, 'applicantId');
    const hashedVote = getUrlParam(location, 'hashedVote');

    this.state = {
      applicantId,
      salt: '', // TODO show salts from local storage in a dropdown
      hashedVote
    };
  }

  render () {
    let { applicantId, salt, hashedVote } = this.state;
    const applicantOpts = accountIdsToOptions(this.props.applicants || []);

    const myVote = hashedVote ? findVoteByHash(hashedVote) : undefined;
    if (myVote) {
      // Try to substitue applicantId and salt from local sotre:
      if (!applicantId) applicantId = myVote.applicantId;
      if (!salt) salt = myVote.salt;
    }

    const hasHash = nonEmptyStr(hashedVote);
    const isVoteRevealed = hasHash && hashedVote === hashVote(applicantId, salt);

    return (
      <div>
        <div className='ui--row'>
          <Input
            label='Hashed vote (hex):'
            value={hashedVote}
            onChange={this.onChangeHash}
          />
        </div>
        {hasHash && <div className='ui--row'>
          <InputAddress
            label='Applicant I voted for:'
            onChange={this.onChangeApplicant}
            type='address'
            options={applicantOpts}
            value={applicantId}
            placeholder='Select an applicant you voted for'
          />
        </div>}
        {hasHash && <div className='ui--row'>
          <Input
            className='large'
            label='The salt used to vote for this applicant:'
            value={salt}
            onChange={this.onChangeSalt}
          />
        </div>}
        <Labelled style={{ marginTop: '.5rem' }}>
          <TxButton
            size='large'
            isDisabled={!isVoteRevealed}
            label='Reveal this vote'
            params={[hashedVote, applicantId, salt]}
            tx='councilElection.reveal'
          />
        </Labelled>
      </div>
    );
  }

  private onChangeApplicant = (applicantId: string | null) => {
    this.setState({ applicantId });
  }

  private onChangeSalt = (salt?: string) => {
    this.setState({ salt });
  }

  private onChangeHash = (hashedVote?: string) => {
    this.setState({ hashedVote });
  }
}

export default withMulti(
  RevealVoteForm,
  translate,
  withOnlyMembers,
  withCalls<Props>(
    queryToProp('query.councilElection.applicants')
  )
);
