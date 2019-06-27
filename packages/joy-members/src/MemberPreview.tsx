import React from 'react';
import { Link } from 'react-router-dom';

import { ApiProps } from '@polkadot/ui-api/types';
import { I18nProps } from '@polkadot/ui-app/types';
import { withCalls, withMulti } from '@polkadot/ui-api/with';
import { Option,AccountId } from '@polkadot/types';
import IdentityIcon from '@polkadot/ui-app/IdentityIcon';

import translate from './translate';
import { MemberId, Profile } from '@joystream/types/members';
import { queryMembershipToProp } from './utils';
import { Seat } from '@joystream/types/';
import { nonEmptyStr, queryToProp } from '@polkadot/joy-utils/index';
import { FlexCenter } from '@polkadot/joy-utils/FlexCenter';
import { MutedSpan } from '@polkadot/joy-utils/MutedText';

const AvatarSizePx = 36;

type MemberPreviewProps = ApiProps & I18nProps & {
  accountId: AccountId,
  memberId?: MemberId,
  memberProfile?: Option<any>, // TODO refactor to Option<Profile>
  activeCouncil?: Seat[],
  prefixLabel?: string
};

class InnerMemberPreview extends React.PureComponent<MemberPreviewProps> {

  render () {
    const { memberProfile } = this.props;
    return memberProfile
      ? this.renderProfile(memberProfile.unwrap() as Profile)
      : null;
  }

  private renderProfile (memberProfile: Profile) {
    const { activeCouncil = [], accountId, prefixLabel } = this.props;
    const { handle, avatar_uri } = memberProfile;

    const hasAvatar = avatar_uri && nonEmptyStr(avatar_uri.toString());
    const isCouncilor: boolean = accountId !== undefined && activeCouncil.find(x => accountId.eq(x.member)) !== undefined;

    return <div className='JoyMemberPreview'>
      <FlexCenter>
        {prefixLabel &&
          <MutedSpan className='PrefixLabel'>{prefixLabel}</MutedSpan>
        }
        {hasAvatar
          ? <img className='Avatar' src={avatar_uri.toString()} width={AvatarSizePx} height={AvatarSizePx} />
          : <IdentityIcon className='Avatar' value={accountId} size={AvatarSizePx} />
        }
        <div className='Content'>
          <div className='Username'>
            <Link to={`/members/${handle.toString()}`} className='handle'>{handle.toString()}</Link>
          </div>
          <div className='Details'>
            {isCouncilor &&
              <b className='muted text' style={{ color: '#607d8b' }}>
                <i className='university icon'></i>
                Council member
              </b>}
          </div>
        </div>
      </FlexCenter>
    </div>;
  }
}

type WithMemberIdByAccountIdProps = {
  memberIdByAccountId?: Option<MemberId>
};

const withMemberIdByAccountId = withCalls<WithMemberIdByAccountIdProps>(
  queryMembershipToProp('memberIdByAccountId', 'accountId')
);

function setMemberIdByAccountId (Component: React.ComponentType<MemberPreviewProps>) {
  return function (props: WithMemberIdByAccountIdProps & MemberPreviewProps) {
    const { memberIdByAccountId: opt } = props;
    if (opt) {
      if (opt.isSome) {
        const memberId = opt.unwrap();
        return <Component {...props} memberId={memberId} />;
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
    queryMembershipToProp('memberProfile', 'memberId')
  )
);
