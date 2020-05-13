import React from "react";
import { Image } from "semantic-ui-react";
import { IdentityIcon } from "@polkadot/react-components";
import { Link } from "react-router-dom";
import styled from 'styled-components';

type ProfileItemProps = {
  avatar_uri: string;
  root_account: string;
  handle: string;
  link?: boolean;
};

const StyledProfilePreview = styled.div`
  display: flex;
  align-items: center;
  & .ui.avatar.image {
    margin: 0 !important;
    width: 40px !important;
    height: 40px !important;
  }
`;

const DetailsHandle = styled.h4`
  margin: 0;
  margin-left: 1rem;
  font-weight: bold;
  color: #333;
`;

export default function ProfilePreview({ avatar_uri, root_account, handle, link = false }: ProfileItemProps) {
  const Preview = (
    <StyledProfilePreview>
      {avatar_uri ? (
        <Image src={avatar_uri} avatar floated="left" />
      ) : (
        <IdentityIcon className="image" value={root_account} size={40} />
      )}
      <DetailsHandle>{handle}</DetailsHandle>
    </StyledProfilePreview>
  );

  if (link) {
    return <Link to={ `/members/${ handle }` }>{ Preview }</Link>;
  }

  return Preview;
}
