import React, { useEffect, useState, useContext } from 'react';

import { Loader } from 'semantic-ui-react';
import { ApiContext } from '@polkadot/react-api';
import ProfilePreview from './MemberProfilePreview';
import { AccountId } from '@polkadot/types/interfaces';
import { memberFromAccount, MemberFromAccount } from './accounts';

import styled from 'styled-components';

const MemberByAccount = styled.div``;

type Props = {
  accountId: AccountId | string;
};

const MemberByAccountPreview: React.FunctionComponent<Props> = ({ accountId }) => {
  const { api } = useContext(ApiContext);
  const [member, setMember] = useState(null as MemberFromAccount | null);
  useEffect(
    () => {
      let isSubscribed = true;
      memberFromAccount(api, accountId).then(member => isSubscribed && setMember(member));
      return () => { isSubscribed = false; };
    },
    [accountId]
  );

  return (
    <MemberByAccount>
      { member
        ? (
          member.profile
            ? <ProfilePreview
              avatar_uri={member.profile.avatar_uri.toString()}
              root_account={member.profile.root_account.toString()}
              handle={member.profile.handle.toString()}
              id={member.id}
              link={true}/>
            : 'Member profile not found!'
        )
        : <Loader inline active>Fetching member profile...</Loader>
      }
    </MemberByAccount>
  );
};

export default MemberByAccountPreview;
