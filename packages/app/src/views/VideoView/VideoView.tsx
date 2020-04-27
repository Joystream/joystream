import React from "react";

import {
  Video,
  GenericSection,
  ChannelSummary,
  DetailsTable,
} from "components";
import { useParams, RouteComponentProps } from "@reach/router";

type VideoViewProps = {
  video: any;
  channel: any;
};
function VideoViewComponent({ video, channel }: VideoViewProps) {
  return (
    <>
      <GenericSection>
        <Video src={video.src} poster={video.poster} />
      </GenericSection>
      <GenericSection
        topDivider
        title={video.title}
        className="video-details"
      >
        <ChannelSummary
          isPublic={channel.isPublic}
          img={channel.img}
          channelUrl="/"
          name={channel.name}
          isVerified={channel.isVerified}
          description={video.description}
          size="default"
        />
      </GenericSection>
      <GenericSection
        topDivider
        title="Video details"
        className="video-details-table"
      >
        <DetailsTable details={video.details} />
      </GenericSection>
    </>
  );
}

type RouteProps = {
  videos: any;
  channels: any;
} & RouteComponentProps;

export default function VideoView({ videos, channels }: RouteProps) {
  let params = useParams();
  let video = Object.values(videos).flat()[params.idx];
  let channel = channels[video.channel];
  return <VideoViewComponent video={video} channel={channel} />;
}
