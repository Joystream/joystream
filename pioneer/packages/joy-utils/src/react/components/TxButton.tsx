import React, { useContext } from 'react';
import { TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';
import { Button } from '@polkadot/react-components/index';
import QueueContext from '@polkadot/react-components/Status/Context';
import { assert } from '@polkadot/util';
import { ButtonProps as DefaultButtonProps } from '@polkadot/react-components/Button/types';
import { StrictButtonProps as SemanticButtonStrictProps, Button as SemanticButton } from 'semantic-ui-react';
import { useApi } from '@polkadot/react-hooks';
import { useMyAccount } from '../hooks';
import _ from 'lodash';

export type OnTxButtonClick = (sendTx: () => void) => void;

type TxButtonBaseProps = {
  accountId?: string;
  type?: 'submit' | 'button';
  params: Array<any>;
  tx: string;
  onClick?: OnTxButtonClick;
  txFailedCb?: TxFailedCallback;
  txSuccessCb?: TxCallback;
  txStartCb?: () => void;
  txUpdateCb?: TxCallback;
}

// Allows us to exclude those from button props
const txButtonNotPassedProps: readonly (keyof TxButtonBaseProps)[] = [
  'accountId',
  'params',
  'tx',
  'onClick',
  'txFailedCb',
  'txSuccessCb',
  'txStartCb',
  'txUpdateCb'
 ] as const;

type SemanticButtonProps = SemanticButtonStrictProps & { style?: React.CSSProperties };

type TxButtonProps<ButtonComponentProps extends Record<string, any>> = Omit<ButtonComponentProps, 'onClick'> & TxButtonBaseProps;

function useTxButton(props: TxButtonBaseProps) {
  const { queueExtrinsic } = useContext(QueueContext);
  const { api } = useApi();
  const { state: { address: myAddress } } = useMyAccount();
  const {
    accountId, params, tx,
    txFailedCb, txSuccessCb, txStartCb, txUpdateCb
  } = props;
  const origin = accountId || myAddress;

  const sendTx = () => {
    const [section, method] = tx.split('.');

    assert(api.tx[section] && api.tx[section][method], `Unable to find api.tx.${section}.${method}`);

    queueExtrinsic({
      accountId: origin,
      extrinsic: api.tx[section][method](...params),
      txFailedCb,
      txSuccessCb,
      txStartCb,
      txUpdateCb
    });
  }

  return { origin, sendTx };
}

// Make icon optional since we provide default value
type DefaultTxButtonProps = TxButtonProps<Omit<DefaultButtonProps, 'icon'> & { icon?: DefaultButtonProps['icon'] }>;

export const DefaultTxButton = (props: DefaultTxButtonProps) => {
  const { origin, sendTx } = useTxButton(props);
  const { isDisabled, icon = 'check', onClick } = props;
  const buttonProps = _.omit(props, txButtonNotPassedProps);

  return (
    <Button
      {...buttonProps}
      isDisabled={isDisabled || !origin}
      icon={icon}
      onClick={() => {
        if (onClick) onClick(sendTx);
        else sendTx();
      }}
    />
  );
}

type SemanticTxButtonProps = TxButtonProps<SemanticButtonProps>;

export const SemanticTxButton = (props: SemanticTxButtonProps) => {
  const { origin, sendTx } = useTxButton(props);
  const { disabled, onClick } = props;
  const buttonProps = _.omit(props, txButtonNotPassedProps);

  return (
    <SemanticButton
      {...buttonProps}
      disabled={disabled || !origin}
      onClick={() => {
        if (onClick) onClick(sendTx);
        else sendTx();
      }}
    />
  );
}

export default DefaultTxButton;

// const SubstrateTxButton = withApi(withMyAccount(TxButton));

// const mockSendTx = () => {
//   const msg = 'Cannot send a Substrate tx in a mock mode';
//   if (typeof window !== 'undefined') {
//     window.alert(`WARN: ${msg}`);
//   } else if (typeof console.warn === 'function') {
//     console.warn(msg);
//   } else {
//     console.log(`WARN: ${msg}`);
//   }
// };

// function MockTxButton (props: BasicButtonProps) {
//   const { isPrimary = true, icon = '', onClick } = props;

//   return (
//     <Button
//       {...props}
//       isPrimary={isPrimary}
//       icon={icon as string}
//       onClick={() => {
//         if (onClick) onClick(mockSendTx);
//         else mockSendTx();
//       }}
//     />
//   );
// }

// function ResolvedButton (props: BasicButtonProps) {
//   const isMock = useTransportContext() instanceof MockTransport;

//   return isMock
//     ? <MockTxButton {...props} />
//     : <SubstrateTxButton {...props} />;
// }

// export default ResolvedButton;
