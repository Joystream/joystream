import React from "react";
import { Router } from "@reach/router";
import { Provider } from "react-redux";

import store from "./store";
import { Layout, VideoGallery } from "./components";

export default function App() {
	return (
		<main className="main-section">
			<Provider store={store}>
				<Layout>
					<h1>Hello Atlas</h1>
					<VideoGallery title="Continue Watching" />
					<VideoGallery title="Top Trending Videos" />
					<VideoGallery title="Top Trending Series" />
					<VideoGallery title="Featured Videos" />
					<VideoGallery title="Trending Channels" />
					<VideoGallery title="Top Trending Playlist" />
					<VideoGallery title="Newest Videos" />
				</Layout>
			</Provider>
		</main>
	);
}
