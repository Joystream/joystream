import { MediaView } from '../MediaView';
import { OuterProps, EditForm } from './EditChannel';

export const EditChannelView = MediaView<OuterProps>({
  component: EditForm,
  resolveProps: async (props) => {
    const { transport, id } = props;
    const entity = id ? await transport.channelById(id) : undefined;
    return { entity };
  }
});

export default EditChannelView;
