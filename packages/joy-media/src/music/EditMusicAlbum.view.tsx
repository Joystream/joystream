import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './EditMusicAlbum';

export const EditMusicAlbumView = MediaView<OuterProps>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id ? await transport.musicAlbumById(id) : undefined;
    return { entity };
  }
});

export default EditMusicAlbumView;
