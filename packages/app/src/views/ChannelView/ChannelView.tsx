import React from "react";
import { GenericSection, VideoPreview } from "components";
import { ChannelHeader } from "../../components/ChannelHeader";
import { RouteComponentProps, useParams } from "@reach/router";

type ChannelProps = {
  name: string;
  isPublic?: boolean;
  isVerified?: boolean;
  description?: string;
  banner?: string;
  videos?: any[];
  img: string;
};

function ChannelComponent({
  name,
  isPublic = true,
  isVerified = false,
  description,
  banner,
  videos,
  img,
}: ChannelProps) {
  return (
    <>
      <ChannelHeader
        name={name}
        isPublic={isPublic}
        isVerified={isVerified}
        description={description}
        banner={banner}
        img={img}
      />
      <GenericSection auto title="Videos">
        <div className="video-gallery">
          {videos.map((video, idx) => (
            <VideoPreview
              url={`videos/${idx}`}
              channelUrl={`channels/${video.channel}`}
              key={`title-${idx}`}
              title={video.title}
              poster={video.poster}
            />
          ))}
        </div>
      </GenericSection>
    </>
  );
}

type RouteProps = {
  videos: any;
  channels: any;
} & RouteComponentProps;

export default function Channel({ videos, channels }: RouteProps) {
  let params = useParams();
  let channelVideos = videos[params.channelName];
  let channel = channels[params.channelName];
  return <ChannelComponent {...channel} videos={channelVideos} />;
}
