import React from 'react';
import { Button, Segment } from 'semantic-ui-react';
import { ChannelEntity } from '../entities/MusicChannelEntity';
import { YouHaveNoChannels } from './YouHaveNoChannels';
import Section from '@polkadot/joy-utils/Section';

type Props = {
  suspended?: boolean,
  channels?: ChannelEntity[]
};

export function MyChannels (props: Props) {
  const { suspended = false, channels = [] } = props;

  return <Section title='My Channels'>
    {!channels.length
      ? <YouHaveNoChannels suspended={suspended} />
      : channels.map(x => (
        <Segment padded>TODO channel preview</Segment>
      ))
    }</Section>;
}