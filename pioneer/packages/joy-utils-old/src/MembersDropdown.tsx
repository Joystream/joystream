import React, { useEffect, useState, useContext } from 'react';
import { Dropdown, DropdownItemProps, DropdownProps } from 'semantic-ui-react';
import { Membership } from '@joystream/types/members';
import { memberFromAccount, MemberFromAccount } from './accounts';
import { AccountId } from '@polkadot/types/interfaces';
import { ApiContext } from '@polkadot/react-api';
import styled from 'styled-components';

const StyledMembersDropdown = styled(Dropdown)`
  & .ui.avatar.image {
    width: 2em !important;
    height: 2em !important;
  }
`;

function membersToOptions (members: MemberFromAccount[]) {
  const validMembers = members.filter(m => m.profile !== undefined) as (MemberFromAccount & { profile: Membership })[];
  return validMembers
    .map(({ id, profile, account }) => ({
      key: profile.handle,
      text: `${profile.handle} (id:${id})`,
      value: account,
      image: profile.avatar_uri.toString() ? { avatar: true, src: profile.avatar_uri } : null
    }));
}

type Props = {
  accounts: (string | AccountId)[];
  name?: DropdownProps['name'];
  onChange?: DropdownProps['onChange'];
  value?: DropdownProps['value'];
  placeholder?: DropdownProps['placeholder'];
};

const MembersDropdown: React.FunctionComponent<Props> = ({ accounts, ...passedProps }) => {
  const { api } = useContext(ApiContext);
  // State
  const [loading, setLoading] = useState(true);
  const [membersOptions, setMembersOptions] = useState([] as DropdownItemProps[]);
  // Generate members options array on load
  useEffect(() => {
    let isSubscribed = true;
    Promise
      .all(accounts.map(acc => memberFromAccount(api, acc)))
      .then(members => {
        if (isSubscribed) {
          setMembersOptions(membersToOptions(members));
          setLoading(false);
        }
      });
    return () => { isSubscribed = false; };
  }, [accounts]);

  return (
    <StyledMembersDropdown
      clearable
      search
      fluid
      selection
      { ...passedProps }
      options={membersOptions}
      loading={loading}
    />
  );
};

export default MembersDropdown;
