import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './UploadAudio';

export const UploadAudioView = MediaView<OuterProps>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id ? await transport.musicTrackById(id) : undefined;
    const opts = await transport.dropdownOptions();
    return { entity, opts };
  }
});

export default UploadAudioView;
