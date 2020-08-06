import React from 'react';
import { Link } from 'react-router-dom';

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import { Vec } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import IdentityIcon from '@polkadot/react-components/IdentityIcon';

import translate from './translate';
import { MemberId, Membership } from '@joystream/types/members';
import { queryMembershipToProp } from './utils';
import { Seat } from '@joystream/types/council';
import { nonEmptyStr, queryToProp } from '@polkadot/joy-utils/index';
import { FlexCenter } from '@polkadot/joy-utils/FlexCenter';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';

const AvatarSizePx = 36;
const InlineAvatarSizePx = 24;

type MemberPreviewProps = ApiProps & I18nProps & {
  accountId: AccountId;
  memberId?: MemberId;
  membership?: Membership;
  activeCouncil?: Seat[];
  prefixLabel?: string;
  inline?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

class InnerMemberPreview extends React.PureComponent<MemberPreviewProps> {
  render () {
    const { membership } = this.props;
    return membership && !membership.handle.isEmpty
      ? this.renderProfile(membership)
      : null;
  }

  private renderProfile (membership: Membership) {
    const { activeCouncil = [], accountId, prefixLabel, inline, className, style } = this.props;
    const { handle, avatar_uri } = membership;

    const hasAvatar = avatar_uri && nonEmptyStr(avatar_uri.toString());
    const isCouncilor: boolean = accountId !== undefined && activeCouncil.find(x => accountId.eq(x.member)) !== undefined;

    const avatarSize = inline ? InlineAvatarSizePx : AvatarSizePx;

    return <div className={`JoyMemberPreview ${className}`} style={style}>
      <FlexCenter>
        {prefixLabel &&
          <MutedSpan className='PrefixLabel'>{prefixLabel}</MutedSpan>
        }
        {hasAvatar ? (
          <img className="Avatar" src={avatar_uri.toString()} width={avatarSize} height={avatarSize} />
        ) : (
          <IdentityIcon className="Avatar" value={accountId} size={avatarSize} />
        )
        }
        <div className='Content'>
          <div className='Username'>
            <Link to={`/members/${handle.toString()}`} className='handle'>{handle.toString()}</Link>
          </div>
          {!inline && (
            <div className='Details'>
              {isCouncilor &&
                <b className='muted text' style={{ color: '#607d8b' }}>
                  <i className='university icon'></i>
                  Council member
                </b>}
            </div>
          )}
        </div>
      </FlexCenter>
    </div>;
  }
}

type WithMemberIdByAccountIdProps = {
  memberIdsByRootAccountId?: Vec<MemberId>;
  memberIdsByControllerAccountId?: Vec<MemberId>;
};

const withMemberIdByAccountId = withCalls<WithMemberIdByAccountIdProps>(
  queryMembershipToProp('memberIdsByRootAccountId', 'accountId'),
  queryMembershipToProp('memberIdsByControllerAccountId', 'accountId')
);

// Get first matching memberid controlled by an account
function setMemberIdByAccountId (Component: React.ComponentType<MemberPreviewProps>) {
  return function (props: WithMemberIdByAccountIdProps & MemberPreviewProps) {
    const { memberIdsByRootAccountId, memberIdsByControllerAccountId } = props;

    if (memberIdsByRootAccountId && memberIdsByControllerAccountId) {
      memberIdsByRootAccountId.concat(memberIdsByControllerAccountId);

      if (memberIdsByRootAccountId.length) {
        return <Component {...props} memberId={memberIdsByRootAccountId[0]} />;
      } else {
        return <em>Member not found</em>;
      }
    } else {
      return null;
    }
  };
}

export const MemberPreview = withMulti(
  InnerMemberPreview,
  translate,
  withMemberIdByAccountId,
  setMemberIdByAccountId,
  withCalls<MemberPreviewProps>(
    queryToProp('query.council.activeCouncil'), // TODO Refactor: extract ActiveCouncilContext
    queryMembershipToProp('membershipById', { paramName: 'memberId', propName: 'membership' })
  )
);
