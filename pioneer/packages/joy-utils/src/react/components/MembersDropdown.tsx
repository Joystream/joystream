import React, { useEffect, useState } from 'react';
import { Dropdown, DropdownItemProps, DropdownProps } from 'semantic-ui-react';
import { MemberFromAccount } from '../../types/members';
import { useTransport } from '../hooks';
import { AccountId } from '@polkadot/types/interfaces';
import styled from 'styled-components';

const StyledMembersDropdown = styled(Dropdown)`
  & .ui.avatar.image {
    width: 2em !important;
    height: 2em !important;
  }
`;

function membersToOptions (members: MemberFromAccount[]) {
  const validMembers = members.filter((m) => m.profile !== undefined);

  // Here we can assert "profile!" and "memberId!", because we filtered out those that don't have it.
  return validMembers
    .map(({ memberId, profile, account }) => ({
      key: profile!.handle.toString(),
      text: `${profile!.handle.toString()} (id:${memberId!})`,
      value: account,
      image: profile!.avatar_uri.toString() ? { avatar: true, src: profile!.avatar_uri } : null
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
  const transport = useTransport();
  // State
  const [loading, setLoading] = useState(true);
  const [membersOptions, setMembersOptions] = useState([] as DropdownItemProps[]);

  // Generate members options array on load
  useEffect(() => {
    let isSubscribed = true;

    Promise
      .all(accounts.map((acc) => transport.members.membershipFromAccount(acc)))
      .then((members) => {
        if (isSubscribed) {
          setMembersOptions(membersToOptions(members));
          setLoading(false);
        }
      })
      .catch((e) => { throw e; });

    return () => { isSubscribed = false; };
    // We don't need transport.members as dependency here, because we assume it's always the same, so:
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
