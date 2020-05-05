import React from "react";
import { Image, Header } from "semantic-ui-react";
import { IdentityIcon } from "@polkadot/react-components";

type ProfileItemProps = {
  avatar_uri: string;
  root_account: string;
  handle: string;
};

export default function ProfilePreview({ avatar_uri, root_account, handle }: ProfileItemProps) {
  return (
    <div className="details-profile">
      {avatar_uri ? (
        <Image src={avatar_uri} avatar floated="left" />
      ) : (
        <IdentityIcon className="image" value={root_account} size={40} />
      )}
      <Header as="h4" className="details-handle">
        {handle}
      </Header>
    </div>
  );
}
