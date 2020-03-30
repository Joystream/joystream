import React from "react";
import { GenericSection, VideoPreview, Avatar, Button } from "components";

type ExploreViewProps = {
  videos: any[];
  channels: any[];
};

export default function ExploreView({ channels, videos }: ExploreViewProps) {
  console.log(channels);
  let allVideos = Object.values(videos).flat();
  return (
    <>
      <GenericSection topDivider title="Latest Videos">
        <div className="video-gallery">
          {allVideos.map((video, idx) => {
            let { img: channelImg } = channels[video.channel] || "";

            return (
              <VideoPreview
                url="#"
                key={`${video.title}-${idx}`}
                channelImg={channelImg}
                channelUrl="#"
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
          {Object.values(channels).map((channel, idx) => {
            let { name, img, isPublic, isVerified } = channel;
            return (
              <div className="channel-header">
                <Avatar link="#" size="default" img={img} />
                <div className="channel-details">
                  <h1>{name}</h1>
                  <div>
                    {isPublic && (
                      <Button
                        outlined
                        color="success"
                        size="small"
                        className="channel-btn"
                      >
                        Public
                      </Button>
                    )}
                    {isVerified && (
                      <Button
                        outlined
                        color="primary"
                        size="small"
                        className="channel-btn"
                      >
                        Verified
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GenericSection>
    </>
  );
}
