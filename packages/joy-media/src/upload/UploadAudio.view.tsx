import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './UploadAudio';

export const UploadAudioView = MediaView<OuterProps>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id ? await transport.musicTrackById(id) : undefined;
    return { entity };
  }
});

export default UploadAudioView;
