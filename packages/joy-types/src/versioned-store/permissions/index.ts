import { getTypeRegistry } from '@polkadot/types';

import { Credential, CredentialSet } from './credentials';
import EntityPermissions from './EntityPermissions';
import { ReferenceConstraint} from './reference-constraint';
import ClassPermissionsType from './ClassPermissions';
import { Operation } from './batching/';

export function registerVersionedStorePermissionsTypes () {
    try {
      getTypeRegistry().register({
        Credential,
        CredentialSet,
        EntityPermissions,
        ReferenceConstraint,
        ClassPermissionsType,
        Operation,
      });
    } catch (err) {
      console.error('Failed to register custom types of versioned store module', err);
    }
  }
