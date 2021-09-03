import React, { useState, useEffect } from 'react';
import { useApi, useCall } from '@polkadot/react-hooks';
import { Text } from '@polkadot/types';
import { u32 } from '@polkadot/types/primitive';
import { Form, TextArea, Modal } from 'semantic-ui-react';
import { Loading } from './PromiseComponent';
import TxButton from './TxButton';
import { useMyAccount } from '../hooks';

export function MemoForm () {
  const { isApiReady, api } = useApi();
  const { state: { address } } = useMyAccount();
  const storedMemo = useCall<Text>(isApiReady && api.query.memo.memo, [address]);
  const maxMemoLength = useCall<u32>(isApiReady && api.query.memo.maxMemoLength, []);
  const [memo, setMemo] = useState<string | undefined>(undefined);
  const isMemoDifferent = memo?.toString() !== storedMemo?.toString();

  useEffect(() => {
    if (storedMemo) {
      setMemo(storedMemo.toString());
    }
  }, [storedMemo]);

  return memo !== undefined
    ? (
      <Form style={{ width: '100%' }}>
        <Form.Field>
          <TextArea
            rows={3}
            label='Memo (supports Markdown):'
            placeholder='Here you can type any public information relevant to your account.'
            value={memo}
            onChange={(e, props) => setMemo(props.value?.toString() || '')}
            maxLength={maxMemoLength}
          />
        </Form.Field>
        <TxButton
          isDisabled={!isMemoDifferent}
          label='Update memo'
          params={[memo]}
          tx='memo.updateMemo'
        />
      </Form>
    )
    : <Loading text={'Fetching current memo...'} />;
}

interface MemoModalProps {
  onClose: () => void;
}

export function MemoModal ({ onClose }: MemoModalProps) {
  return (
    <Modal
      size='small'
      open
      closeIcon
      closeOnDimmerClick={true}
      style={{ marginTop: '30px' }}
      onClose={onClose}>
      <Modal.Header>Update memo</Modal.Header>
      <Modal.Content>
        <MemoForm />
      </Modal.Content>
    </Modal>
  );
}
