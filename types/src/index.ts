
import { getTypeRegistry } from "@polkadot/types";

import { registerCommonTypes } from "./common";
import { registerMembershipTypes } from "./members";
import { registerCouncilAndElectionTypes } from "./council";
import { registerRolesTypes } from "./roles";
import { registerForumTypes } from "./forum";
import { registerStakeTypes } from "./stake";
import { registerMintTypes } from "./mint";
import { registerRecurringRewardsTypes } from "./recurring-rewards";
import { registerHiringTypes } from "./hiring";
import { registerVersionedStoreTypes } from "./versioned-store"; //Circular dep FIX needed - depends on ChannelId from content working group!
import { registerVersionedStorePermissionsTypes } from "./versioned-store/permissions"; // depends on versioned store!
import { registerContentWorkingGroupTypes } from "./content-working-group"; // depends on Credential from versioned permissions store!
import { registerBureaucracyTypes } from "./bureaucracy";
import { registerDiscoveryTypes } from "./discovery";
import { registerMediaTypes } from "./media"; // depends on StorageProviderId from buraucracy.. not ideal
import { registerProposalTypes } from "./proposals";

export function registerJoystreamTypes() {
  const typeRegistry = getTypeRegistry();

  typeRegistry.register({
    MemoText: "Text", // for the memo module
  });

  registerCommonTypes();
  registerMembershipTypes();
  registerCouncilAndElectionTypes();
  registerRolesTypes();
  registerForumTypes();
  registerStakeTypes();
  registerMintTypes();
  registerRecurringRewardsTypes();
  registerHiringTypes();
  registerVersionedStoreTypes();
  registerVersionedStorePermissionsTypes();
  registerContentWorkingGroupTypes();
  registerBureaucracyTypes();
  registerDiscoveryTypes();
  registerMediaTypes();
  registerProposalTypes();
}
