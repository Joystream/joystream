import React from 'react';
import { Image } from 'semantic-ui-react';
import { IdentityIcon } from '@polkadot/react-components';
import { Link } from 'react-router-dom';
import { Text } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import { MemberId, Profile } from '@joystream/types/members';
import styled from 'styled-components';

type ProfileItemProps = {
  avatar_uri: string | Text;
  root_account: string | AccountId;
  handle: string | Text;
  link?: boolean;
  id?: number | MemberId;
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
      {avatar_uri.toString() ? (
        <Image src={avatar_uri.toString()} avatar floated="left" />
      ) : (
        <IdentityIcon className="image" value={root_account.toString()} size={40} />
      )}
      <Details>
        <DetailsHandle>{handle.toString()}</DetailsHandle>
        { id !== undefined && <DetailsID>ID: {id.toString()}</DetailsID> }
      </Details>
    </StyledProfilePreview>
  );

  if (link) {
    return <Link to={ `/members/${handle.toString()}` }>{ Preview }</Link>;
  }

  return Preview;
}

type ProfilePreviewFromStructProps = {
  profile: Profile;
  link?: boolean;
  id?: number | MemberId;
};

export function ProfilePreviewFromStruct ({ profile, link, id }: ProfilePreviewFromStructProps) {
  const { avatar_uri, root_account, handle } = profile;
  return <ProfilePreview {...{ avatar_uri, root_account, handle, link, id }} />;
}
