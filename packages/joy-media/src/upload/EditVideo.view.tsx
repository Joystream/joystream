import React from 'react';
import { RouteComponentProps } from 'react-router';
import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './UploadVideo';
import EntityId from '@joystream/types/versioned-store/EntityId';

type Props = OuterProps;

export const EditVideoView = MediaView<Props>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id ? await transport.videoById(id) : undefined;
    const opts = await transport.dropdownOptions();
    return { entity, opts };
  }
});

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
