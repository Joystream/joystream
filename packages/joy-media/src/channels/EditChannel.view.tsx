import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './EditChannel';
import { ChannelId } from '@joystream/types/content-working-group';
import { JoyError } from '@polkadot/joy-utils/JoyWarn';

type Props = OuterProps;

export const EditChannelView = MediaView<Props>({
  component: EditForm,
  membersOnly: true,
  triggers: [ 'id' ],
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id && await transport.channelById(id);
    const constraints = await transport.channelValidationConstraints()
    return { entity, constraints };
  }
})

type WithRouterProps = Props & RouteComponentProps<any>

export const EditChannelWithRouter = (props: WithRouterProps) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <EditChannelView {...props} id={new ChannelId(id)} />;
    } catch (err) {
      console.log('EditChannelWithRouter failed:', err);
    }
  }

  return <JoyError title={`Invalid channel id in URL`}>{id}</JoyError>
}
