import { handleNewTip, handleTipRetracted, handleTipClosing, handleTipClosed } from './../mappings/treasury/tip';
import { Extrinsic } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { QueryEventProcessingPack, SubstrateEvent } from '../../src';
import * as BN from 'bn.js';

export const tipEventPack: QueryEventProcessingPack = {
  'newTip': handleNewTip,
  'tipRetracted': handleTipRetracted,
  'tipClosing': handleTipClosing,
  'tipClosed': handleTipClosed
};

export const newTipEvent_report_awesome: SubstrateEvent = {
  event_name: 'treasury.newTip',
  event_method: 'newTip',
  event_params: {
    Hash: ('aaaaaa' as unknown) as Codec,
  },
  index: new BN(0),
  block_number: new BN(0),
  extrinsic: ({
    signer: 'signer',
    args: ['xxxxxx', 'who', '100000000'],
    meta: {
      name: 'report_awesome'
    }
  } as unknown) as Extrinsic,
} as SubstrateEvent;

export const tipClosingEvent: SubstrateEvent = {
  event_name: 'treasury.tipClosing',
  event_method: 'tipClosing',
  event_params: {
    Hash: ('aaaaaa' as unknown) as Codec,
  },
  index: new BN(0),
  block_number: new BN(1),
  extrinsic: ({
    signer: 'signer',
    args: ['xxxxxx', '500000000'],
  } as unknown) as Extrinsic,
} as SubstrateEvent;
