import React from 'react';
import { ChannelEntity } from '../entities/ChannelEntity';
import { isVerifiedChannel, isCensoredChannel } from './ChannelHelpers';
import { useMyMembership } from '@polkadot/joy-utils/react/hooks';
import { SemanticTxButton } from '@polkadot/joy-utils/react/components/TxButton';
import { AccountId } from '@polkadot/types/interfaces';
import { useApi } from '@polkadot/react-hooks';
import { Icon } from 'semantic-ui-react';

type ChannelCurationPanelProps = {
  channel: ChannelEntity;
};

export const CurationPanel = (props: ChannelCurationPanelProps) => {
  const { api } = useApi();
  const { curationActor, allAccounts } = useMyMembership();
  const { channel } = props;

  const canUseAccount = (account: AccountId) => {
    if (!allAccounts || !Object.keys(allAccounts).length) {
      return false;
    }

    const ix = Object.keys(allAccounts).findIndex((key) => {
      return account.eq(allAccounts[key].json.address);
    });

    return ix !== -1;
  };

  const renderToggleCensorshipButton = () => {
    if (!curationActor) { return null; }

    const [curation_actor, role_account] = curationActor;
    const accountAvailable = canUseAccount(role_account);

    const isCensored = isCensoredChannel(channel);

    const new_curation_status = api.createType('ChannelCurationStatus',
      isCensored ? 'Normal' : 'Censored'
    );

    return <SemanticTxButton
      accountId={role_account.toString()}
      type='submit'
      size='small'
      color={isCensored ? undefined : 'red'}
      disabled={!accountAvailable}
      params={[
        curation_actor,
        channel.id,
        null, // not changing verified status
        new_curation_status // toggled curation status
      ]}
      tx={'contentWorkingGroup.updateChannelAsCurationActor'}
    >
      <Icon name={isCensored ? 'x' : 'warning'}/>
      { isCensored ? 'Un-Censor' : 'Censor' }
    </SemanticTxButton>;
  };

  const renderToggleVerifiedButton = () => {
    if (!curationActor) { return null; }

    const [curation_actor, role_account] = curationActor;
    const accountAvailable = canUseAccount(role_account);
    const isVerified = isVerifiedChannel(channel);

    return <SemanticTxButton
      accountId={role_account.toString()}
      type='submit'
      size='small'
      color={isVerified ? undefined : 'green'}
      disabled={!accountAvailable}
      params={[
        curation_actor,
        channel.id,
        !isVerified, // toggle verified
        null // not changing curation status
      ]}
      tx={'contentWorkingGroup.updateChannelAsCurationActor'}
    >
      <Icon name={isVerified ? 'x' : 'checkmark'}/>
      { isVerified ? 'Remove Verification' : 'Verify' }
    </SemanticTxButton>;
  };

  return <>
    <div style={{ display: 'flex', float: 'right', margin: '0.5em', marginRight: 0 }}>
      {renderToggleCensorshipButton()}
      {renderToggleVerifiedButton()}
    </div>
  </>;
};
