import React, { useEffect, useState, useContext } from "react";

import { Loader } from 'semantic-ui-react';
import { ApiPromise } from "@polkadot/api";
import { ApiContext } from "@polkadot/react-api";
import ProfilePreview from "./MemberProfilePreview";
import { MemberId, Profile } from "@joystream/types/members";
import { Option } from "@polkadot/types";
import { AccountId } from "@polkadot/types/interfaces";
import { Vec } from "@polkadot/types/codec";

import styled from 'styled-components';

const memberFromAccount = async (api: ApiPromise, accountId: AccountId | string) => {
  const [memberId] =
    ((await api.query.members.memberIdsByRootAccountId(accountId)) as Vec<MemberId>)
    .concat((await api.query.members.memberIdsByControllerAccountId(accountId)) as Vec<MemberId>);
  const member = (await api.query.members.memberProfile(memberId)) as Option<Profile>;

  return { id: memberId, profile: member.unwrapOr(undefined) };
}

const MemberByAccount = styled.div``;

type Props = {
  accountId: AccountId | string;
};

const MemberByAccountPreview: React.FunctionComponent<Props> = ({ accountId }) => {
  const { api } = useContext(ApiContext);
  const [ member, setMember ] = useState(null as { id: MemberId, profile?: Profile } | null);
  useEffect(
    () => { memberFromAccount(api, accountId).then(member => setMember(member)); },
    [accountId]
  );

  return (
    <MemberByAccount>
      { member ?
        (
          member.profile ?
            <ProfilePreview
              avatar_uri={member.profile.avatar_uri.toString()}
              root_account={member.profile.root_account.toString()}
              handle={member.profile.handle.toString()}
              id={member.id.toNumber()}
              link={true}/>
            : 'Member profile not found!'
        )
        : <Loader inline active>Fetching member profile...</Loader>
      }
    </MemberByAccount>
  );
};

export default MemberByAccountPreview;
