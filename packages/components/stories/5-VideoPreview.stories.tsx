import React from "react";

import { VideoPreview } from "../src/";

export default {
  title: "Video Preview",
  component: VideoPreview,
};

let VideoPreviewData = {
  url: "#",
  title: "frankenstain",
  channel: "Kek-Mex's video channel",
  channelImg:
    "https://s3.amazonaws.com/keybase_processed_uploads/9003a57620356bd89d62bd34c7c0c305_360_360.jpg",
  poster:
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Reefer_Madness_%281936%29.jpg",
  link: "#",
};

export const Default = () => <VideoPreview {...VideoPreviewData} />;

export const withChannel = () => (
  <VideoPreview {...VideoPreviewData} showChannel />
);
