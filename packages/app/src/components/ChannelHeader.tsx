import React from "react";

import { Banner, ChannelSummary } from "components";

type ChannelHeaderProps = {
  img?: string;
  name: string;
  banner?: string;
  isPublic?: boolean;
  isVerified?: boolean;
  description?: string;
  channelUrl?: string;
};

export function ChannelHeader({
  img,
  isPublic = true,
  isVerified = false,
  description,
  name,
  banner,
  channelUrl,
}: ChannelHeaderProps) {
  return (
    <>
      {banner && <Banner src={banner} />}
      <ChannelSummary
        name={name}
        isPublic={isPublic}
        isVerified={isVerified}
        size="large"
        img={img}
        description={description}
        channelUrl={channelUrl}
      />
    </>
  );
}
