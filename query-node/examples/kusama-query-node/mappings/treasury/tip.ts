import { DB, SubstrateEvent } from '../../generated/indexer';
import { Tip } from '../../generated/graphql-server/src/modules/tip/tip.model';
import { Tipper } from '../../generated/graphql-server/src/modules/tipper/tipper.model';
import { assert } from 'console';

export async function handleNewTip(db: DB, event: SubstrateEvent) {
  const { Hash } = event.event_params;
  const { extrinsic } = event;

  if (extrinsic) {
    const tip = new Tip();
    tip.reason = Buffer.from(Hash.toString());
    tip.who = Buffer.from(extrinsic.args[1]);
    tip.retracted = false;
    tip.finder = Buffer.from(extrinsic?.signer.toString());

    const runtimeFuncName = extrinsic.meta.name.toString();
    // check runtime function name that emit the event
    tip.findersFee = runtimeFuncName === 'report_awesome';

    db.save<Tip>(tip);

    // NewTip event can be fired from different runtime functions
    if (runtimeFuncName !== 'report_awesome') {
      //Give a tip for something new; no finder's fee will be taken.
      const t = new Tipper();
      t.tipValue = extrinsic.args[2].toString();
      t.tipper = Buffer.from(extrinsic?.signer.toString());
      t.tip = tip;
      db.save<Tipper>(t);
    }
  }
}

export async function handleTipRetracted(db: DB, event: SubstrateEvent) {
  const { Hash } = event.event_params;
  const tip = await db.get(Tip, { where: { reason: Buffer.from(Hash.toString()) } });

  assert(tip, 'Invalid reason hash!');
  if (tip) {
    tip.retracted = true;
    db.save<Tip>(tip);
  }
}

// A tip suggestion has reached threshold and is closing.
export async function handleTipClosing(db: DB, event: SubstrateEvent) {
  const { Hash } = event.event_params;
  const { extrinsic } = event;
  const tip = await db.get(Tip, { where: { reason: Buffer.from(Hash.toString()) } });

  assert(tip, 'Invalid reason hash!');
  if (tip && extrinsic) {
    const t = new Tipper();
    t.tipper = Buffer.from(extrinsic?.signer.toString());
    t.tipValue = extrinsic.args[1].toString();
    t.tip = tip;
    db.save<Tipper>(t);

    tip.closes = event.block_number.toString();
    db.save<Tip>(tip);
  }
}

// A tip suggestion has reached threshold and is closing.
export async function handleTipClosed(db: DB, event: SubstrateEvent) {
  const { Hash, AccountId } = event.event_params;
  const { extrinsic } = event;
  const tip = await db.get(Tip, { where: { reason: Buffer.from(Hash.toString()) } });

  assert(tip, 'Invalid reason hash!');

  if (tip && extrinsic) {
    tip.who = Buffer.from(AccountId.toString());
  }
}
