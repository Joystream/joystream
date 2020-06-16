import React from "react";
import { Router } from "@reach/router";
import { Provider } from "react-redux";

import store from "./store";
import { Layout, VideoGallery, Hero, Tags, SeriesGallery, ChannelGallery } from "./components";

export default function App() {
	return (
		<main className="main-section">
			<Provider store={store}>
				<Layout>
					<Hero />
					<VideoGallery title="Continue Watching" log />
					<VideoGallery title="Top Trending Videos" />
					<SeriesGallery title="Top Trending Series" />
					<VideoGallery title="Featured Videos" />
					<Tags title="Top Categories" />
					<ChannelGallery title="Trending Channels" />
					<VideoGallery title="Top Trending Playlist" />
					<VideoGallery title="Newest Videos" />
				</Layout>
			</Provider>
		</main>
	);
}
