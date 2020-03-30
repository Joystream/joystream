import React from "react";
import { GeneralSection, Avatar, Button } from "components";

type ChannelProps = {
  name: string;
  isPublic?: boolean;
  isVerified?: boolean;
  description?: string;
  videos?: any[];
  img: string;
};

export default function Channel({
  name,
  isPublic = true,
  isVerified = false,
  description,
  videos,
}: ChannelProps) {
  return (
    <>
      <div>
        <Avatar link="#" size="large" />
        <h1>{channelName}</h1>
        <div>
          {isPublic && (
            <Button outlined color="success" size="small">
              Public
            </Button>
          )}
          {isVerified && (
            <Button outlined color="primary" size="small">
              Verified
            </Button>
          )}
          <p>{description}</p>
          )}
        </div>
      </div>
      <GeneralSection auto title="Videos">
        <div className="video-gallery"></div>
      </GeneralSection>
    </>
  );
}
