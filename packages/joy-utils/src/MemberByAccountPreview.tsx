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
  const memberIds =
    ((await api.query.members.memberIdsByRootAccountId(accountId)) as Vec<MemberId>)
    .concat((await api.query.members.memberIdsByControllerAccountId(accountId)) as Vec<MemberId>);
  const member = (await api.query.members.memberProfile(memberIds[0])) as Option<Profile>;

  return member.unwrapOr(null);
}

const MemberByAccount = styled.div``;

type Props = {
  accountId: AccountId | string;
};

const MemberByAccountPreview: React.FunctionComponent<Props> = ({ accountId }) => {
  const { api } = useContext(ApiContext);
  const [ member, setMember ] = useState(null as Profile | null);
  useEffect(
    () => { memberFromAccount(api, accountId).then(member => setMember(member)); },
    [accountId]
  );

  return (
    <MemberByAccount>
      { member ?
        (
          <ProfilePreview
            avatar_uri={member.avatar_uri.toString()}
            root_account={member.root_account.toString()}
            handle={member.handle.toString()}
            link={true}/>
        )
        : <Loader active>Fetching member profile...</Loader>
      }
    </MemberByAccount>
  );
};

export default MemberByAccountPreview;
