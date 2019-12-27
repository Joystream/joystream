import { MediaView, MediaViewProps } from '../MediaVIew';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { OuterProps, EditMusicAlbum } from './EditMusicAlbum';

export class EditMusicAlbumView extends MediaView<OuterProps> {

  constructor (props: MediaViewProps<OuterProps>) {
    super(EditMusicAlbum, props);
  }

  async resolveProps () {
    const { id: idStr } = this.routeProps?.match.params as any;
    const id = new EntityId(idStr as string);
    const entity = await this.transport.musicAlbumById(id);
    return { entity };
  }
}

export default EditMusicAlbumView;
