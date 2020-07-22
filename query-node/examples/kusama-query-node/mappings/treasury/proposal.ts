import { SubstrateEvent, DB } from '../../generated/indexer';
import { Proposal } from '../../generated/graphql-server/src/modules/proposal/proposal.model';
import { ProposalStatus } from '../../generated/graphql-server/src/modules/enums/enums';
import { assert } from 'console';

// New proposal
export async function handleProposed(db: DB, event: SubstrateEvent) {
  const { ProposalIndex } = event.event_params;
  if (event.extrinsic) {
    const proposal = new Proposal();
    proposal.proposalIndex = ProposalIndex.toString();
    proposal.value = event.extrinsic?.args[0].toString();
    proposal.bond = event.extrinsic?.args[0].toString();
    proposal.beneficiary = Buffer.from(event.extrinsic?.args[1].toString());
    proposal.proposer = Buffer.from(event.extrinsic?.signer.toString());
    proposal.status = ProposalStatus.NONE;

    await db.save<Proposal>(proposal);
  }
}

// A proposal was rejected
export async function handleRejected(db: DB, event: SubstrateEvent) {
  const { ProposalIndex } = event.event_params;
  const proposal = await db.get(Proposal, { where: { proposalIndex: ProposalIndex.toString() } });

  assert(proposal, 'Proposal not found! Invalid proposal id');

  if (proposal) {
    proposal.status = ProposalStatus.REJECTED;
    await db.save<Proposal>(proposal);
  }
}

// A proposal is approved! Some funds have been allocated.
export async function handleAwarded(db: DB, event: SubstrateEvent) {
  const { ProposalIndex } = event.event_params;
  const proposal = await db.get(Proposal, { where: { proposalIndex: ProposalIndex.toString() } });

  assert(proposal, 'Proposal not found! Invalid proposal id');

  if (proposal) {
    proposal.status = ProposalStatus.APPROVED;
    await db.save<Proposal>(proposal);
  }
}
