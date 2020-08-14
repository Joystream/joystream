import React from 'react';

import ProfilePreview from './MemberProfilePreview';
import { AccountId } from '@polkadot/types/interfaces';
import { MemberFromAccount } from '../../types/members';
import { useTransport, usePromise } from '../hooks';

import styled from 'styled-components';
import PromiseComponent from './PromiseComponent';

const MemberByAccount = styled.div``;

type Props = {
  accountId: AccountId | string;
};

const MemberByAccountPreview: React.FunctionComponent<Props> = ({ accountId }) => {
  const transport = useTransport();
  const [member, error, loading] = usePromise<MemberFromAccount | null>(
    () => transport.members.membershipFromAccount(accountId),
    null,
    [accountId]
  );

  return (
    <PromiseComponent error={error} loading={loading} message="Fetching member profile...">
      <MemberByAccount>
        { member && (
          member.profile
            ? <ProfilePreview
              avatar_uri={member.profile.avatar_uri.toString()}
              root_account={member.profile.root_account.toString()}
              handle={member.profile.handle.toString()}
              id={member.memberId}
              link={true}/>
            : 'Member profile not found!'
        ) }
      </MemberByAccount>
    </PromiseComponent>
  );
};

export default MemberByAccountPreview;
