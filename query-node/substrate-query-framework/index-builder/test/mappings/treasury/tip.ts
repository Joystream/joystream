import { DatabaseManager as DB } from '../../../src/db';
import { SubstrateEvent } from '../../../src';
import { Tip } from '../../models/tip.model';
import { Tipper } from '../../models/tipper.model';
import { assert } from 'console';
import * as BN from 'bn.js';
import Debug from 'debug';

const debug = Debug('index-builder:tip-mapping')

export async function handleNewTip(db: DB, event: SubstrateEvent): Promise<void> {
  const { Hash } = event.event_params;
  const { extrinsic } = event;

  if (extrinsic) {
    const tip = new Tip();
    tip.reason = Buffer.from(Hash.toString());
    tip.who = Buffer.from(extrinsic.args[1]);
    tip.retracted = false;
    tip.finder = Buffer.from(extrinsic?.signer.toString());
    debug('new tip ');
    
    const runtimeFuncName = extrinsic?.meta.name.toString();
    // check runtime function name that emit the event
    tip.findersFee = runtimeFuncName === 'report_awesome';

    await db.save<Tip>(tip);
    debug('save done');
    
    // NewTip event can be fired from different runtime functions
    if (runtimeFuncName !== 'report_awesome') {
      //Give a tip for something new; no finder's fee will be taken.
      const t = new Tipper();
      t.tipValue = new BN(extrinsic?.args[2].toString());
      t.tipper = Buffer.from(extrinsic?.signer.toString());
      t.tip = tip;
      await db.save<Tipper>(t);
    }
  }
}

export async function handleTipRetracted(db: DB, event: SubstrateEvent): Promise<void> {
  const { Hash } = event.event_params;
  const tip = await db.get(Tip, { where: { reason: Buffer.from(Hash.toString()) } });

  assert(tip, 'Invalid reason hash!');
  if (tip) {
    tip.retracted = true;
    await db.save<Tip>(tip);
  }
}

// A tip suggestion has reached threshold and is closing.
export async function handleTipClosing(db: DB, event: SubstrateEvent): Promise<void> {
  const { Hash } = event.event_params;
  const { extrinsic } = event;
  const tip = await db.get(Tip, { where: { reason: Buffer.from(Hash.toString()) } });

  assert(tip, 'Invalid reason hash!');
  if (tip && extrinsic) {
    const t = new Tipper();
    t.tipper = Buffer.from(extrinsic?.signer.toString());
    t.tipValue = new BN(extrinsic?.args[1].toString());
    t.tip = tip;
    await db.save<Tipper>(t);
    // should we add the tipper to the tipper list here?
    tip.closes = new BN(event.block_number.toString());
    await db.save<Tip>(tip);
  }
}

// A tip suggestion has reached threshold and is closing.
export async function handleTipClosed(db: DB, event: SubstrateEvent): Promise<void> {
  const { Hash, AccountId } = event.event_params;
  const { extrinsic } = event;
  const tip = await db.get(Tip, { where: { reason: Buffer.from(Hash.toString()) } });

  assert(tip, 'Invalid reason hash!');

  if (tip && extrinsic) {
    tip.who = Buffer.from(AccountId.toString());
    await db.save<Tip>(tip);
  }

}
