import { getTypeRegistry, u64} from '@polkadot/types';

export class RecipientId extends u64 {};
export class RewardRelationshipId extends u64 {};

export function registerRecurringRewardsTypes () {
    try {
      getTypeRegistry().register({
        RecipientId,
        RewardRelationshipId,
        // todo
        'Recipient': {},
        'RewardRelationship': {},
      });
    } catch (err) {
      console.error('Failed to register custom types of recurring rewards module', err);
    }
}