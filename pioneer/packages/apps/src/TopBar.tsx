import React from 'react';
// import { Link } from 'react-router-dom';
import { I18nProps } from '@polkadot/react-components/types';
import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { InputAddress } from '@polkadot/react-components';
import { Available } from '@polkadot/react-query';
import translate from './translate';
import './TopBar.css';

type Props = I18nProps & {};

function renderAddress (address: string) {
  const balance = <span className="label">Balance: </span>;

  return (
    <div className="JoyTopBar">
      <InputAddress
        defaultValue={address}
        help="My current key that signs transactions"
        label="My key"
        labelExtra={<Available label={balance} params={address} />}
        type="account"
      />
    </div>
  );
}

// function renderNoAddress() {
//   return (
//     <div className="JoyTopBar NoMyAddress">
//       <i className="warning sign icon"></i>
//       <span style={{ marginRight: '1rem' }}>You need to create a key if you want to use all features.</span>
//       <Link className="ui small button orange" to="/accounts">
//         Create key
//       </Link>
//     </div>
//   );
// }

function Component (_props: Props) {
  const {
    state: { address }
  } = useMyAccount();
  return address ? renderAddress(address) : null;
}

export default translate(Component);
