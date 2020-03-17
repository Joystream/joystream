import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './EditChannel';
import { ChannelId } from '@joystream/types/content-working-group';
import { withMembershipRequired } from '@polkadot/joy-utils/MyAccount';

type Props = OuterProps;

export const EditChannelView = withMembershipRequired(MediaView<Props>({
  component: EditForm,
  triggers: [ 'id' ],
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id && await transport.channelById(id);
    const constraints = await transport.channelValidationConstraints()
    return { entity, constraints };
  }
}))

type WithRouterProps = Props & RouteComponentProps<any>

export const EditChannelWithRouter = withMembershipRequired((props: WithRouterProps) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <EditChannelView {...props} id={new ChannelId(id)} />;
    } catch (err) {
      console.log('EditChannelWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid channel id in URL: ${id}</em>;
})
