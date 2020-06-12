import React from 'react';
import { Image } from 'semantic-ui-react';
import { IdentityIcon } from '@polkadot/react-components';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

type ProfileItemProps = {
  avatar_uri: string;
  root_account: string;
  handle: string;
  link?: boolean;
  id?: number;
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

const Details = styled.div``;

const DetailsHandle = styled.h4`
  margin: 0;
  margin-left: 1rem;
  font-weight: bold;
  color: #333;
`;

const DetailsID = styled.div`
  margin: 0;
  margin-top: 0.25rem;
  margin-left: 1rem;
  color: #777;
`;

export default function ProfilePreview ({ id, avatar_uri, root_account, handle, link = false }: ProfileItemProps) {
  const Preview = (
    <StyledProfilePreview>
      {avatar_uri ? (
        <Image src={avatar_uri} avatar floated="left" />
      ) : (
        <IdentityIcon className="image" value={root_account} size={40} />
      )}
      <Details>
        <DetailsHandle>{handle}</DetailsHandle>
        { id !== undefined && <DetailsID>ID: {id}</DetailsID> }
      </Details>
    </StyledProfilePreview>
  );

  if (link) {
    return <Link to={ `/members/${handle}` }>{ Preview }</Link>;
  }

  return Preview;
}
