import React from "react";
import ChannelView from "./views/ChannelView";
import data from "../staticData";

let channel = data.channels[0];
let videos = data.videos[channel.name];
export default function App() {
  return (
    <main className="main-section">
      <ChannelView
        name={channel.name}
        isPublic={channel.isPublic}
        isVerified={channel.isVerified}
        img={channel.img}
        banner={channel.banner}
        description={channel.description}
        videos={videos}
      />
    </main>
  );
}
