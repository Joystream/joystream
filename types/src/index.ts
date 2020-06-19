
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
import { registerVersionedStoreTypes } from "./versioned-store";
import { registerVersionedStorePermissionsTypes } from "./versioned-store/permissions";
import { registerContentWorkingGroupTypes } from "./content-working-group";
import { registerWorkingGroupTypes } from "./working-group";
import { registerDiscoveryTypes } from "./discovery";
import { registerMediaTypes } from "./media";
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
  registerWorkingGroupTypes();
  registerDiscoveryTypes();
  registerMediaTypes();
  registerProposalTypes();
}
