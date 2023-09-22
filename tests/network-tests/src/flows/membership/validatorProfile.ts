import { FlowProps } from "../../Flow";
import {
  BuyMembershipHappyCaseFixture,
  MemberProfileData,
  UpdateProfileHappyCaseFixture,
} from "../../fixtures/membership";

import { extendDebug } from "../../Debugger";
import { FixtureRunner } from "../../Fixture";
import { generateParamsFromAccountId } from "../../fixtures/membership/utils";
import { WorkingGroupMetadata } from "@joystream/metadata-protobuf";

export default async function validatorAccount({
  api,
  query,
}: FlowProps): Promise<void> {
  const debug = extendDebug("flow:validator-account-update");
  debug("Started");
  api.enableDebugTxLogs();

  // const updates: WorkingGroupMetadata[] = [
  //   // Partial updates
  //   // FIXME: Currently handle always need to be provided, see: https://github.com/Joystream/joystream/issues/2503
  //   {
  //       about:""
  //   }
  // ]

  const [account] = (await api.createKeyPairs(1)).map(({ key }) => key.address);
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    api,
    query,
    [account]
  );
  await new FixtureRunner(buyMembershipHappyCaseFixture).run();
  const [memberId] = buyMembershipHappyCaseFixture.getCreatedMembers();

  let oldValues: MemberProfileData = generateParamsFromAccountId(account);
  //   for (const newValues of updates) {
  //     const context = { account, memberId }
  //     const updateProfileHappyCaseFixture = new UpdateProfileHappyCaseFixture(api, query, context, oldValues, newValues)

  //     await new FixtureRunner(updateProfileHappyCaseFixture).runWithQueryNodeChecks()
  //     oldValues = updateProfileHappyCaseFixture.getExpectedValues()
  //   }

  debug("Done");
}
