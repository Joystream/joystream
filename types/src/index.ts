
import { getTypeRegistry } from "@polkadot/types";

import * as common from "./common";
import * as members from "./members";
import * as council from "./council";
import * as roles from "./roles";
import * as forum from "./forum";
import * as stake from "./stake";
import * as mint from "./mint";
import * as recurringRewards from "./recurring-rewards";
import * as hiring from "./hiring";
import * as versionedStore from "./versioned-store";
import * as versionedStorePermissions from "./versioned-store/permissions";
import * as contentWorkingGroup from "./content-working-group";
import * as workingGroup from "./working-group";
import * as discovery from "./discovery";
import * as media from "./media";
import * as proposals from "./proposals";

export {
  common,
  members,
  council,
  roles,
  forum,
  stake,
  mint,
  recurringRewards,
  hiring,
  versionedStore,
  versionedStorePermissions,
  contentWorkingGroup,
  workingGroup,
  discovery,
  media,
  proposals
};

export function registerJoystreamTypes() {
  const typeRegistry = getTypeRegistry();

  typeRegistry.register({
    MemoText: "Text", // for the memo module
  });

  common.registerCommonTypes();
  members.registerMembershipTypes();
  council.registerCouncilAndElectionTypes();
  roles.registerRolesTypes();
  forum.registerForumTypes();
  stake.registerStakeTypes();
  mint.registerMintTypes();
  recurringRewards.registerRecurringRewardsTypes();
  hiring.registerHiringTypes();
  versionedStore.registerVersionedStoreTypes();
  versionedStorePermissions.registerVersionedStorePermissionsTypes();
  contentWorkingGroup.registerContentWorkingGroupTypes();
  workingGroup.registerWorkingGroupTypes();
  discovery.registerDiscoveryTypes();
  media.registerMediaTypes();
  proposals.registerProposalTypes();
}
