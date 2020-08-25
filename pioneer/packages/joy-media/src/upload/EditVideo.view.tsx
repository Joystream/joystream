import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './UploadVideo';
import { JoyError } from '@polkadot/joy-utils/react/components';
import { useApi } from '@polkadot/react-hooks';

type Props = OuterProps;

export const EditVideoView = MediaView<Props>({
  component: EditForm,
  membersOnly: true,
  triggers: ['id'],
  resolveProps: async (props) => {
    const { transport, id, channelId } = props;
    const channel = channelId && await transport.channelById(channelId);
    const mediaObjectClass = await transport.mediaObjectClass();
    const entityClass = await transport.videoClass();
    const entity = id && await transport.videoById(id);
    const opts = await transport.dropdownOptions();

    return { channel, mediaObjectClass, entityClass, entity, opts };
  }
});

type WithRouterProps = Props & RouteComponentProps<any>

export const UploadVideoWithRouter = (props: WithRouterProps) => {
  const { match: { params: { channelId } } } = props;
  const { api } = useApi();

  if (channelId) {
    try {
      return <EditVideoView {...props} channelId={api.createType('ChannelId', channelId)} />;
    } catch (err) {
      console.log('UploadVideoWithRouter failed:', err);
    }
  }

  return <JoyError title={'Invalid channel id in URL'}>{channelId}</JoyError>;
};

export const EditVideoWithRouter = (props: WithRouterProps) => {
  const { match: { params: { id } } } = props;
  const { api } = useApi();

  if (id) {
    try {
      return <EditVideoView {...props} id={api.createType('EntityId', id)} />;
    } catch (err) {
      console.log('EditVideoWithRouter failed:', err);
    }
  }

  return <JoyError title={'Invalid video id in URL'}>{id}</JoyError>;
};

export default EditVideoView;
