import React from 'react';
import { BareProps, ApiProps } from '@polkadot/react-api/types';
import { QueueTxExtrinsicAdd, PartialQueueTxExtrinsic, TxFailedCallback, TxCallback } from '@polkadot/react-components/Status/types';
import { Button } from '@polkadot/react-components/index';
import { QueueConsumer } from '@polkadot/react-components/Status/Context';
import { withApi } from '@polkadot/react-api/index';
import { assert } from '@polkadot/util';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/MyAccount';
import { useTransportContext } from '@polkadot/joy-media/TransportContext';
import { MockTransport } from '@polkadot/joy-media/transport.mock';
import { Button$Sizes } from '@polkadot/react-components/Button/types';
import { SemanticShorthandItem, IconProps } from 'semantic-ui-react';

type InjectedProps = {
  queueExtrinsic: QueueTxExtrinsicAdd;
};

export type OnTxButtonClick = (sendTx: () => void) => void;

type BasicButtonProps = {
  accountId?: string;
  type?: 'submit' | 'button';
  size?: Button$Sizes;
  isBasic?: boolean;
  isPrimary?: boolean;
  isDisabled?: boolean;
  label?: React.ReactNode;
  params: Array<any>;
  tx: string;

  className?: string;
  style?: Record<string, string | number>;
  children?: React.ReactNode;
  compact?: boolean;
  icon?: boolean | SemanticShorthandItem<IconProps>;

  onClick?: OnTxButtonClick;
  txFailedCb?: TxFailedCallback;
  txSuccessCb?: TxCallback;
  txStartCb?: () => void;
  txUpdateCb?: TxCallback;
};

type PropsWithApi = BareProps & ApiProps & MyAccountProps & PartialQueueTxExtrinsic & BasicButtonProps

class TxButtonInner extends React.PureComponent<PropsWithApi & InjectedProps> {
  render () {
    const { myAddress, accountId, isPrimary = true, isDisabled, icon = '', onClick } = this.props;
    const origin = accountId || myAddress;

    return (
      <Button
        {...this.props}
        isDisabled={isDisabled || !origin}
        isPrimary={isPrimary}
        icon={icon as string}
        onClick={() => {
          if (onClick) onClick(this.send);
          else this.send();
        }}
      />
    );
  }

  private send = (): void => {
    const {
      myAddress, accountId, api, params, queueExtrinsic, tx,
      txFailedCb, txSuccessCb, txStartCb, txUpdateCb
    } = this.props;
    const origin = accountId || myAddress;
    const [section, method] = tx.split('.');

    assert(api.tx[section] && api.tx[section][method], `Unable to find api.tx.${section}.${method}`);

    queueExtrinsic({
      accountId: origin,
      extrinsic: api.tx[section][method](...params) as any, // ???
      txFailedCb,
      txSuccessCb,
      txStartCb,
      txUpdateCb
    });
  }
}

class TxButton extends React.PureComponent<PropsWithApi> {
  render () {
    return (
      <QueueConsumer>
        {({ queueExtrinsic }) => (
          <TxButtonInner
            {...this.props}
            queueExtrinsic={queueExtrinsic}
          />
        )}
      </QueueConsumer>
    );
  }
}

const SubstrateTxButton = withApi(withMyAccount(TxButton));

const mockSendTx = () => {
  const msg = 'Cannot send a Substrate tx in a mock mode';
  if (typeof window !== 'undefined') {
    window.alert(`WARN: ${msg}`);
  } else if (typeof console.warn === 'function') {
    console.warn(msg);
  } else {
    console.log(`WARN: ${msg}`);
  }
};

function MockTxButton (props: BasicButtonProps) {
  const { isPrimary = true, icon = '', onClick } = props;

  return (
    <Button
      {...props}
      isPrimary={isPrimary}
      icon={icon as string}
      onClick={() => {
        if (onClick) onClick(mockSendTx);
        else mockSendTx();
      }}
    />
  );
}

function ResolvedButton (props: BasicButtonProps) {
  const isMock = useTransportContext() instanceof MockTransport;

  return isMock
    ? <MockTxButton {...props} />
    : <SubstrateTxButton {...props} />;
}

export default ResolvedButton;
