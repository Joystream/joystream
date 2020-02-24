import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './EditChannel';
import { ChannelId } from '@joystream/types/content-working-group';

type Props = OuterProps;

export const EditChannelView = MediaView<Props>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id && await transport.channelById(id);
    const constraints = await transport.channelValidationConstraints()
    return { entity, constraints };
  }
});

export const EditChannelWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <EditChannelView {...props} id={new ChannelId(id)} />;
    } catch (err) {
      console.log('EditChannelWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid channel id in URL: ${id}</em>;
}
