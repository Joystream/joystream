import React from "react";
import { Image, Header } from "semantic-ui-react";
import { IdentityIcon } from "@polkadot/react-components";
import { Link } from "react-router-dom";

type ProfileItemProps = {
  avatar_uri: string;
  root_account: string;
  handle: string;
  link?: boolean;
};

export default function ProfilePreview({ avatar_uri, root_account, handle, link = false }: ProfileItemProps) {
  const Preview = (
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

  if (link) {
    return <Link to={ `/members/${ handle }` }>{ Preview }</Link>;
  }

  return Preview;
}
