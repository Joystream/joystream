import React from 'react';

import { I18nProps } from '@polkadot/react-components/types';
import { withCalls } from '@polkadot/react-api/with';
import { stringToU8a, u8aToHex } from '@polkadot/util';

import translate from './translate';
import Details from './Details';
import { MemberId } from '@joystream/types/members';
import { queryMembershipToProp } from './utils';

type DetailsByHandleProps = {
  handle: string;
  memberIdByHandle?: MemberId;
};

function DetailsByHandleInner (p: DetailsByHandleProps) {
  const { memberIdByHandle: memberId } = p;
  return memberId !== undefined // here we can't make distinction value existing and loading
    ? <div className='ui massive relaxed middle aligned list FullProfile'>
      <Details memberId={memberId} />
    </div>
    : <em>Member profile not found.</em>;
}

const DetailsByHandle = withCalls<DetailsByHandleProps>(
  queryMembershipToProp('memberIdByHandle', 'handle')
)(DetailsByHandleInner);

type Props = I18nProps & {
  match: {
    params: {
      handle: string;
    };
  };
};

class Component extends React.PureComponent<Props> {
  render () {
    const { match: { params: { handle } } } = this.props;
    const handleHex = u8aToHex(stringToU8a(handle));
    return (
      <DetailsByHandle handle={handleHex} />
    );
  }
}

export default translate(Component);
