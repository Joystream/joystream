import React from "react";
import { SemanticShorthandItem, IconProps, SemanticCOLORS, Button } from "semantic-ui-react";

type InjectedProps = {
  queueExtrinsic: QueueTxExtrinsicAdd;
};

type BasicButtonProps = {
  accountId?: string;
  type?: "submit" | "button";
  color?: SemanticCOLORS;
  disabled?: boolean;
  params?: any[];
  tx?: string;
  className?: string;
  children?: React.ReactChildren;
  icon?: SemanticShorthandItem<IconProps>;
  onClick?: () => void;
  onTxFailed?: () => void;
  onTxSuccess?: () => void;
};

function ButtonInner(props: BasicButtonProps) {
  const { accountId, color = "blue", icon, disabled, onClick } = props;
  return <Button color={color} icon={icon} disabled={disabled} />;

  // ********
  function send() {
    const {
      myAddress,
      accountId,
      api,
      params,
      queueExtrinsic,
      tx,
      txFailedCb,
      txSuccessCb,
      txStartCb,
      txUpdateCb
    } = props;

    const origin = accountId || myAddress;
    const [section, method] = tx.split(".");

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
