import React from "react";
import ChannelView from "./views/ChannelView";
import data from "../staticData";
import ExploreView from "./views/ExploreView";

let { channels, videos } = data;
let channel = channels["Kek-Mex's video channel"];
let channelVideos = videos[channel.name];
export default function App() {
  return (
    <main className="main-section">
      {/* <ChannelView
        name={channel.name}
        isPublic={channel.isPublic}
        isVerified={channel.isVerified}
        img={channel.img}
        banner={channel.banner}
        description={channel.description}
        videos={videos}
      /> */}
      <ExploreView channels={channels} videos={videos} />
    </main>
  );
}
