import React from 'react';

import { ProfilePreviewFromStruct } from './MemberProfilePreview';
import { AccountId } from '@polkadot/types/interfaces';
import { MemberFromAccount } from '../../types/members';
import { useTransport, usePromise } from '../hooks';
import styled from 'styled-components';

import PromiseComponent from './PromiseComponent';

type Props = {
  accountId: AccountId | string;
  className?: string;
  showId?: boolean;
  showCouncilBadge?: boolean;
  link?: boolean;
  size?: 'small' | 'medium';
};

const MemberByAccountPreview: React.FunctionComponent<Props> = ({
  accountId,
  showId = true,
  showCouncilBadge = false,
  link = true,
  size,
  className
}) => {
  const transport = useTransport();
  const [member, error, loading] = usePromise<MemberFromAccount | null>(
    () => transport.members.membershipFromAccount(accountId),
    null,
    [accountId]
  );

  return (
    // Span required to allow styled(MemberByAccountPreview)
    <span className={className}>
      <PromiseComponent inline={true} error={error} loading={loading} message='Fetching member profile...'>
        { member && (
          member.profile
            ? (
              <ProfilePreviewFromStruct
                profile={member.profile}
                id={showId ? member.memberId : undefined}
                link={link}
                size={size}>
                { showCouncilBadge && <CouncilBadge memberId={member.memberId!}/> }
              </ProfilePreviewFromStruct>
            )
            : 'Member profile not found!'
        ) }
      </PromiseComponent>
    </span>
  );
};

type CouncilBadgeProps = {
  memberId: number;
}

export function CouncilBadge ({ memberId }: CouncilBadgeProps) {
  const transport = useTransport();
  const [councilMembers] = usePromise(() => transport.council.councilMembers(), []);

  if (councilMembers && councilMembers.find((cm) => cm.memberId.toNumber() === memberId)) {
    return (
      <b style={{ color: '#607d8b' }}>
        <i className='university icon'></i>
        Council member
      </b>
    );
  } else {
    return null;
  }
}

export default styled(MemberByAccountPreview)``; // Allow extending the styles
