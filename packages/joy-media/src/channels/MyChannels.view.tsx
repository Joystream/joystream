import { MediaView } from '../MediaView';
import { MyChannelsProps, MyChannels } from './MyChannels';

export const MyChannelsView = MediaView<MyChannelsProps>({
  component: MyChannels,
  resolveProps: async (props) => {
    const { transport, memberId } = props;
    const channels = await transport.channelsByOwner(memberId);
    return { channels };
  }
});

export default MyChannelsView;