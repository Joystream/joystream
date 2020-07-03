
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

export * from "./common";
export * from "./members";
export * from "./council";
export * from "./roles";
export * from "./forum";
export * from "./stake";
export * from "./mint";
export * from "./recurring-rewards";
// export * from "./hiring"; // name clashes with working-group
export * from "./versioned-store";
export * from "./versioned-store/permissions";
// export * from "./content-working-group"; // clashes with content-working-group
export * from "./working-group";
export * from "./discovery";
export * from "./media";
export * from "./proposals";

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
