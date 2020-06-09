import { MediaView } from '../MediaView';
import { ExploreContentProps, ExploreContent } from './ExploreContent';

export const ExploreContentView = MediaView<ExploreContentProps>({
  component: ExploreContent,
  resolveProps: async (props) => {
    const { transport } = props;

    const [
      latestVideoChannels,
      latestVideos,
      featuredVideos
    ] = await Promise.all([
      transport.latestPublicVideoChannels(),
      transport.latestPublicVideos(),
      transport.featuredVideos()
    ]);

    return { featuredVideos, latestVideos, latestVideoChannels };
  }
});

export default ExploreContentView;
