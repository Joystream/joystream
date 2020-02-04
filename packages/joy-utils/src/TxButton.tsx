import { BareProps, ApiProps } from '@polkadot/react-api/types';
import { QueueTxExtrinsicAdd, PartialQueueTxExtrinsic } from '@polkadot/react-components/Status/types';

import React from 'react';
import { Button } from '@polkadot/react-components/index';
import { QueueConsumer } from '@polkadot/react-components/Status/Context';
import { withApi } from '@polkadot/react-api/index';
import { assert } from '@polkadot/util';
import { withMyAccount, MyAccountProps } from '@polkadot/joy-utils/MyAccount';
import { useTransportContext } from '@polkadot/joy-media/MediaView';
import { MockTransport } from '@polkadot/joy-media/transport.mock';
import { Button$Sizes } from '@polkadot/react-components/Button/types';

type InjectedProps = {
  queueExtrinsic: QueueTxExtrinsicAdd;
};

type Props = BareProps & MyAccountProps & PartialQueueTxExtrinsic & {
  accountId?: string,
  type?: 'submit' | 'button',
  size?: Button$Sizes,
  isPrimary?: boolean,
  isDisabled?: boolean,
  label: React.ReactNode,
  params: Array<any>,
  tx: string,
  onClick?: (sendTx: () => void) => void
};

type PropsWithApi = Props & ApiProps;

class TxButtonInner extends React.PureComponent<PropsWithApi & InjectedProps> {
  render () {
    const { myAddress, accountId, isPrimary = true, isDisabled, onClick } = this.props;
    const origin = accountId || myAddress;

    return (
      <Button
        {...this.props}
        icon=''
        isDisabled={isDisabled || !origin}
        isPrimary={isPrimary}
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
      txFailedCb, txSuccessCb, txStartCb, txUpdateCb,
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
      txUpdateCb,
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

function MockTxButton (props: Props) {
  const { isPrimary = true, onClick } = props;

  const mockSendTx = () => {
    console.log('WARN: Cannot send tx in a mock mode');
  };

  return (
    <Button
      {...props}
      icon=''
      isPrimary={isPrimary}
      onClick={() => {
        if (onClick) onClick(mockSendTx);
        else mockSendTx();
      }}
    />
  );
}

function ResolvedButton (props: Props) {
  const isMock = useTransportContext() instanceof MockTransport;

  const Component = isMock
    ? MockTxButton
    : withApi(withMyAccount(TxButton));

  return <Component {...props} />;
}

export default ResolvedButton;
