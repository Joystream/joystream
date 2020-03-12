import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './EditMusicAlbum';

export const EditMusicAlbumView = MediaView<OuterProps>({
  component: EditForm,
  triggers: [ 'id' ],
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id ? await transport.musicAlbumById(id) : undefined;
    const opts = await transport.dropdownOptions();
    return { entity, opts };
  }
});

export default EditMusicAlbumView;
