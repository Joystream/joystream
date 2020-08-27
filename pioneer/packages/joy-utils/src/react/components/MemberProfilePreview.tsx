import React from 'react';
import { Image, Label } from 'semantic-ui-react';
import { IdentityIcon } from '@polkadot/react-components';
import { Link } from 'react-router-dom';
import { Text } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import { MemberId, Membership } from '@joystream/types/members';
import styled, { css } from 'styled-components';

type ProfilePreviewSize = 'small' | 'medium';

const AVATAR_SIZES_PX: { [k in ProfilePreviewSize]: number } = {
  small: 20,
  medium: 40
};

type ProfileItemProps = {
  avatar_uri: string | Text;
  root_account: string | AccountId;
  handle: string | Text;
  id?: number | MemberId;
  link?: boolean;
  size?: ProfilePreviewSize;
};

type StyledPartProps = {
  size: ProfilePreviewSize;
}

const StyledProfilePreview = styled.div<StyledPartProps>`
  display: flex;
  align-items: center;
  & .ui.avatar.image {
    margin: 0 !important;
    width: ${(props) => `${AVATAR_SIZES_PX[props.size]}px`} !important;
    height: ${(props) => `${AVATAR_SIZES_PX[props.size]}px`} !important;
  }
`;

const Details = styled.div<StyledPartProps>`
  margin-left: ${(props) => props.size === 'small' ? '0.5rem' : '1rem'};
  display: grid;
  grid-row-gap: 0.25rem;
  grid-template-columns: 100%;
`;

const DetailsHandle = styled.h4<StyledPartProps>`
  ${(props) => props.size === 'small' && css`font-size: 1em;`};
  margin: 0;
  font-weight: bold;
  color: #333;
`;

export default function ProfilePreview (
  { id, avatar_uri, root_account, handle, link = false, children, size = 'medium' }: React.PropsWithChildren<ProfileItemProps>
) {
  const Preview = (
    <StyledProfilePreview size={size}>
      {avatar_uri.toString() ? (
        <Image src={avatar_uri.toString()} avatar floated='left' />
      ) : (
        <IdentityIcon className='image' value={root_account.toString()} size={AVATAR_SIZES_PX[size]} />
      )}
      <Details size={size}>
        <DetailsHandle size={size}>{handle.toString()}</DetailsHandle>
        { id !== undefined && <Label size={'small'}>ID <Label.Detail>{id.toString()}</Label.Detail></Label> }
        { children }
      </Details>
    </StyledProfilePreview>
  );

  if (link) {
    return <Link to={ `/members/${handle.toString()}` }>{ Preview }</Link>;
  }

  return Preview;
}

type ProfilePreviewFromStructProps = {
  profile: Membership;
  id?: number | MemberId;
  link?: boolean;
  size?: ProfilePreviewSize;
};

export function ProfilePreviewFromStruct (
  { profile, children, ...passedProps }: React.PropsWithChildren<ProfilePreviewFromStructProps>
) {
  const { avatar_uri, root_account, handle } = profile;

  return (
    <ProfilePreview {...{ avatar_uri, root_account, handle, ...passedProps }}>
      {children}
    </ProfilePreview>
  );
}
