import React from 'react';
import { ChannelEntity } from '../entities/ChannelEntity';
import { isVerifiedChannel, isCensoredChannel } from './ChannelHelpers';
import { useMyMembership } from '@polkadot/joy-utils/MyMembershipContext';
import TxButton from '@polkadot/joy-utils/TxButton';
import { ChannelCurationStatus } from '@joystream/types/content-working-group';

type ChannelCurationPanelProps = {
  channel: ChannelEntity
};

export const CurationPanel = (props: ChannelCurationPanelProps) => {
  const { curationActor } = useMyMembership();
  const { channel } = props;

  const renderToggleCensorshipButton = () => {
    if (!curationActor) { return null }

    const [curation_actor, role_account] = curationActor;

    const isCensored = isCensoredChannel(channel);

    const new_curation_status = new ChannelCurationStatus(
      isCensored ? 'Normal' : 'Censored'
    );

    return <TxButton
      accountId={role_account}
      type='submit'
      size='medium'
      icon={isCensored ? 'x' : 'warning'}
      isDisabled={false}
      label={isCensored ? 'Un-Censor' : 'Censor'}
      params={[
        curation_actor,
        channel.id,
        null, // not changing verified status
        new_curation_status // toggled curation status
      ]}
      tx={'contentWorkingGroup.updateChannelAsCurationActor'}
    />
  }

  const renderToggleVerifiedButton = () => {
    if (!curationActor) { return null }

    const [curation_actor, role_account] = curationActor;

    const isVerified = isVerifiedChannel(channel);

    return <TxButton
      accountId={role_account}
      type='submit'
      size='medium'
      icon={isVerified ? 'x' : 'checkmark'}
      isDisabled={false}
      label={isVerified ? 'Remove Verification' : 'Verify'}
      params={[
        curation_actor,
        channel.id,
        !isVerified, // toggle verified
        null // not changing curation status
      ]}
      tx={'contentWorkingGroup.updateChannelAsCurationActor'}
    />
  }

  return <>
    <div style={{ float: 'right' }}>
    {renderToggleCensorshipButton()}
    {renderToggleVerifiedButton()}
    </div>
  </>
}
