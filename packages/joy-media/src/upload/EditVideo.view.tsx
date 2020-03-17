import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './UploadVideo';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { ChannelId } from '@joystream/types/content-working-group';
import { withMembershipRequired } from '@polkadot/joy-utils/MyAccount';

type Props = OuterProps;

export const EditVideoView = withMembershipRequired(MediaView<Props>({
  component: EditForm,
  triggers: [ 'id' ],
  resolveProps: async (props) => {
    const { transport, id, channelId } = props;
    const channel = channelId && await transport.channelById(channelId);
    const mediaObjectClass = await transport.mediaObjectClass();
    const entityClass = await transport.videoClass();
    const entity = id && await transport.videoById(id);
    const opts = await transport.dropdownOptions();
    return { channel, mediaObjectClass, entityClass, entity, opts };
  }
}))

type WithRouterProps = Props & RouteComponentProps<any>

export const UploadVideoWithRouter = withMembershipRequired((props: WithRouterProps) => {
  const { match: { params: { channelId }}} = props;

  if (channelId) {
    try {
      return <EditVideoView {...props} channelId={new ChannelId(channelId)} />;
    } catch (err) {
      console.log('UploadVideoWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid channel id in URL: ${channelId}</em>;
})

export const EditVideoWithRouter = withMembershipRequired((props: WithRouterProps) => {
  const { match: { params: { id }}} = props;

  if (id) {
    try {
      return <EditVideoView {...props} id={new EntityId(id)} />;
    } catch (err) {
      console.log('EditVideoWithRouter failed:', err);
    }
  }

  return <em>ERROR: Invalid video id in URL: ${id}</em>;
})

export default EditVideoView;
