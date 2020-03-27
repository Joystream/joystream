import React from "react";

import { Video } from "../src/";

export default {
  title: "Video",
  component: Video,
};

let videoData = {
  url:
    "https://www.versokiwi.tk/asset/v0/5FJThQvnNsGG6HHPURbeL1L5oRmSRb42TxPpsngP7VZnjwbr",
  poster:
    "https://image.tmdb.org/t/p/w600_and_h900_bestv2/kZqVmoHksjX1FANINggnaoCmwIn.jpg",
  muted: true,
  width: 600,
  height: 300,
  volume: 0.7,
};

export const Default = () => <Video {...videoData} />;

export const Responsive = () => <Video {...videoData} responsive={true} />;
