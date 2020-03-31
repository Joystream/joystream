import React from "react";
import { Link, RouteComponentProps } from "@reach/router";
import { GenericSection, VideoPreview, ChannelSummary } from "components";

type ExploreViewProps = {
  videos: any;
  channels: any;
} & RouteComponentProps;

export default function ExploreView({
  channels,
  videos,
  path,
}: ExploreViewProps) {
  let allVideos = Object.values(videos).flat();
  let allChannels: any[] = Object.values(channels);

  return (
    <>
      <GenericSection topDivider title="Latest Videos">
        <div className="video-gallery">
          {allVideos.map((video, idx) => {
            let { img: channelImg } = channels[video.channel] || "";

            return (
              <VideoPreview
                url={`videos/${idx}`}
                key={`${video.title}-${idx}`}
                channelImg={channelImg}
                channelUrl={`channels/${video.channel}`}
                channel={video.channel}
                title={video.title}
                poster={video.poster}
                showChannel
              />
            );
          })}
        </div>
      </GenericSection>
      <GenericSection topDivider title="Latest video channels">
        <div className="channel-gallery">
          {allChannels.map((channel, idx) => (
            <ChannelSummary
              key={`${channel.name}-${idx}`}
              channelUrl={`channels/${channel.name}`}
              img={channel.img}
              size="default"
              name={channel.name}
              isPublic={channel.isPublic}
              isVerified={channel.isVerified}
            />
          ))}
        </div>
      </GenericSection>
    </>
  );
}
