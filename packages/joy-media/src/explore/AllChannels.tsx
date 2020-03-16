import React from 'react';
import Section from '@polkadot/joy-utils/Section';
import { MediaView } from '../MediaView';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelPreview } from '../channels/ChannelPreview';

export type Props = {
  channels?: ChannelEntity[]
}

export function AllChannels (props: Props) {
  const { channels = [] } = props;

  return channels.length === 0
    ? <em>No channels found</em>
    : <Section title={`All channels (${channels.length})`} className='ListOfChannels'>
        {channels.map((x) =>
          <ChannelPreview key={x.id} channel={x} withSubtitle={false} />
        )}
      </Section>
}

export const AllChannelsView = MediaView<Props>({
  component: AllChannels,
  resolveProps: async ({ transport }) => ({
    channels: await transport.allPublicVideoChannels()
  })
})
