import { MediaView } from '../MediaView';
import { ExploreContentProps, ExploreContent } from './ExploreContent';

export const ExploreContentView = MediaView<ExploreContentProps>({
  component: ExploreContent,
  resolveProps: async (props) => {
    const { transport } = props;
    const latestVideoChannels = await transport.latestVideoChannels();
    const latestVideos = await transport.latestVideos();
    
    return { latestVideos, latestVideoChannels };
  }
});

export default ExploreContentView;