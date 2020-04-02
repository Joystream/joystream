import React from "react";

import { Avatar } from "../src/";

export default {
  title: "Avatar",
  component: Avatar,
};

let avatarData = {
  img:
    "https://s3.amazonaws.com/keybase_processed_uploads/9003a57620356bd89d62bd34c7c0c305_360_360.jpg",
  link: "#",
};

export const Default = () => <Avatar {...avatarData} />;

export const Small = () => <Avatar {...avatarData} size="small" />;

export const NoImg = () => <Avatar link="#" />;
