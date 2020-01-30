import { MediaView } from '../MediaView';
import { ExploreContentProps, ExploreContent } from './ExploreContent';
import { MusicAlbumSamples, FeaturedAlbums } from '../stories/data/MusicAlbumSamples';

export const ExploreContentView = MediaView<ExploreContentProps>({
  component: ExploreContent,
  resolveProps: async (_props) => {

    // TODO get from transport:
    const featuredAlbums = FeaturedAlbums;
		const latestAlbums = MusicAlbumSamples.reverse();
    
    return { featuredAlbums, latestAlbums };
  }
});

export default ExploreContentView;