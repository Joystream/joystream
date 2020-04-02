import React from "react";
import { Router } from "@reach/router";
import data from "../staticData";

import ChannelView from "./views/ChannelView";
import ExploreView from "./views/ExploreView";
import VideoView from "./views/VideoView";

let { channels, videos } = data;

export default function App() {
  return (
    <main className="main-section">
      <Router>
        <ExploreView path="/" channels={channels} videos={videos} />
        <ChannelView
          path="/channels/:channelName"
          channels={channels}
          videos={videos}
        />
        <VideoView path="/videos/:idx" channels={channels} videos={videos} />
      </Router>
    </main>
  );
}
