import { MediaView, MediaViewProps } from '../MediaVIew';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { OuterProps, EditForm } from './UploadVideo';

export class UploadVideoView extends MediaView<OuterProps> {

  constructor (props: MediaViewProps<OuterProps>) {
    super(EditForm, props);
  }

  async resolveProps () {
    const { id: idStr } = this.routeProps?.match.params as any;
    const id = new EntityId(idStr as string);
    const entity = await this.transport.videoById(id);
    return { entity };
  }
}

export default UploadVideoView;
