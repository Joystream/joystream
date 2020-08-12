import React from 'react';
import { useMyMembership } from '@polkadot/joy-utils/react/hooks';
import { InputAddress } from '@polkadot/react-components';
import { Available } from '@polkadot/react-query';
import styled from 'styled-components';
import { useApi } from '@polkadot/react-hooks';

const StyledTopBar = styled.div`
  padding: 0.75rem;
  background-color: #3f3f3f;
  border-bottom: 1px solid #d4d4d5;
  text-align: right;
  margin: 0;

  &.NoMyAddress {
    background-color: #ffeb83;
    color: #000;
    text-align: center;
  }

  .ui--InputAddress {
    display: inline-block;
  }
`;

function JoyTopBar () {
  const {
    allAccounts,
    myAddress
  } = useMyMembership();

  const { isApiReady } = useApi();

  if (!isApiReady) {
    return null;
  }

  const balance = <span className='label'>Balance: </span>;
  const labelExtra = myAddress
    ? <Available label={balance} params={myAddress} />
    : 'No key selected';

  return Object.keys(allAccounts || {}).length ? (
    <StyledTopBar>
      <InputAddress
        defaultValue={myAddress}
        help='My current key that signs transactions'
        label='My key'
        labelExtra={labelExtra}
        type='account'
      />
    </StyledTopBar>
  ) : null;
}

export default JoyTopBar;
