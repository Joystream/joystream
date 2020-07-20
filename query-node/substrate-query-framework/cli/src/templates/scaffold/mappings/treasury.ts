import { SubstrateEvent, DB } from '../generated/indexer';
import { Proposal } from '../generated/graphql-server/src/modules/proposal/Proposal.model';


/**
 * Event handler for `Proposed` even. By default, all event handlers
 * have name handle<EventName>.
 * 
 * @param db DB repository interface for persisting the mapped instance to the database
 * @param event Raw Substrate Event data for `Proposed` events emitted at the currently indexed block
 */
export async function handleProposed(db: DB, event: SubstrateEvent) {
  if (event.extrinsic) {
    const proposal = new Proposal();
    proposal.value = event.extrinsic.args[0].toString();
    proposal.bond = event.extrinsic.args[0].toString();
    proposal.beneficiary = event.extrinsic.args[1].toString();
    proposal.proposer = event.extrinsic.signer.toString();
    db.save<Proposal>(proposal);
  }
}