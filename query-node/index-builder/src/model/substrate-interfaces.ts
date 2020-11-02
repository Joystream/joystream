import { AnyJson, AnyJsonField } from '../interfaces/json-types'
import * as BN from 'bn.js';


export interface EventParam {
  type: string;
  name: string;
  value: AnyJsonField;
}

export interface ExtrinsicArg {
  type: string;
  name: string;
  value: AnyJsonField;
}

export interface SubstrateEvent {
  name: string;
  method: string;
  section?: string;
  params: Array<EventParam>;
  index: number;
  id: string;
  blockNumber: number;
  extrinsic?: SubstrateExtrinsic;
}

export interface SubstrateExtrinsic {
  method: string;
  section: string;
  versionInfo?: string;
  meta?: AnyJson;
  era?: AnyJson;
  signer: string;
  args: ExtrinsicArg[];
  signature?: string;
  hash?: string;
  tip: BN;
}

