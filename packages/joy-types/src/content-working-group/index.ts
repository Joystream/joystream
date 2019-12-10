import { getTypeRegistry } from '@polkadot/types';
import { ActorId } from '../members';
import { OpeningId, ApplicationId } from '../hiring';
import { Credential } from '../versioned-store/permissions/credentials';

export class ChannelId extends ActorId {};
export class CuratorId extends ActorId {};
export class CuratorOpeningId extends OpeningId {};
export class CuratorApplicationId extends ApplicationId {};
export class LeadId extends ActorId {};
export class PrincipalId extends Credential {};

export function registerContentWorkingGroupTypes () {
    try {
      getTypeRegistry().register({
        ChannelId,
        CuratorId,
        CuratorOpeningId,
        CuratorApplicationId,
        LeadId,
        PrincipalId,
        // todo
        'Channel': {},
        'ChannelContentType': {},
        'ChannelCurationStatus': {},
        'ChannelPublishingStatus': {},
        'CurationActor': {},
        'Curator': {},
        'CuratorApplication': {},
        'CuratorOpening': {},
        'Lead': {},
        'OpeningPolicyCommitment': {},
        'Principal': {},
        'WorkingGroupUnstaker': {},
      });
    } catch (err) {
      console.error('Failed to register custom types of content working group module', err);
    }
}