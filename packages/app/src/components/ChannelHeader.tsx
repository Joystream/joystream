import React from "react";

import { Avatar, Button, Banner } from "components";

type ChannelHeaderProps = {
  img?: string;
  name: string;
  banner?: string;
  isPublic?: boolean;
  isVerified?: boolean;
  description?: string;
};

export function ChannelHeader({
  img,
  isPublic = true,
  isVerified = false,
  description,
  name,
  banner,
}: ChannelHeaderProps) {
  return (
    <>
      {banner && <Banner src={banner} />}
      <div className="channel-header">
        <Avatar link="#" size="large" img={img} />
        <div className="channel-details">
          <h1>{name}</h1>
          <div className="channel-badges">
            <div>Video Channel</div>
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
          <div className="channel-description">
            <p>{description}</p>
          </div>
        </div>
      </div>
    </>
  );
}
