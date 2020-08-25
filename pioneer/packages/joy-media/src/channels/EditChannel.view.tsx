import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './EditChannel';
import { JoyError } from '@polkadot/joy-utils/react/components';
import { useApi } from '@polkadot/react-hooks';

type Props = OuterProps;

export const EditChannelView = MediaView<Props>({
  component: EditForm,
  membersOnly: true,
  triggers: ['id'],
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id && await transport.channelById(id);
    const constraints = await transport.channelValidationConstraints();
    return { entity, constraints };
  }
});

type WithRouterProps = Props & RouteComponentProps<any>

export const EditChannelWithRouter = (props: WithRouterProps) => {
  const { match: { params: { id } } } = props;
  const { api } = useApi();

  if (id) {
    try {
      return <EditChannelView {...props} id={api.createType('ChannelId', id)} />;
    } catch (err) {
      console.log('EditChannelWithRouter failed:', err);
    }
  }

  return <JoyError title={'Invalid channel id in URL'}>{id}</JoyError>;
};
