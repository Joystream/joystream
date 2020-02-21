import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './UploadVideo';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { ChannelId } from '@joystream/types/content-working-group';

type Props = OuterProps;

export const EditVideoView = MediaView<Props>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, channelId, id } = props;
    const channel = channelId && await transport.channelById(channelId);
    const entityClassId = await transport.classIdByName('Video');
    const entity = id && await transport.videoById(id);
    const opts = await transport.dropdownOptions();
    return { channel, entityClassId, entity, opts };
  }
});

export const UploadVideoWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { channelId }}} = props;

  if (channelId) {
    try {
      return <EditVideoView {...props} channelId={new ChannelId(channelId)} />;
    } catch (err) {
      console.log('UploadVideoWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid channel id in URL: ${channelId}</em>;
}

export const EditVideoWithRouter = (props: Props & RouteComponentProps<any>) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <EditVideoView {...props} id={new EntityId(id)} />;
    } catch (err) {
      console.log('EditVideoWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid video id in URL: ${id}</em>;
}

export default EditVideoView;
