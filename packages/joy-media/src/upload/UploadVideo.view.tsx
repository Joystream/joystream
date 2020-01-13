import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './UploadVideo';

export const UploadVideoView = MediaView<OuterProps>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id ? await transport.videoById(id) : undefined;
    const opts = await transport.dropdownOptions();
    return { entity, opts };
  }
});

export default UploadVideoView;
