## Giza vs Olympia

### Event mappings

Most of the events processed by the query node are now mapped to corresponding `{event_name}Event` entities, which implement the [`Event`](./schemas/common.graphql) interface.
Events of different types can be queried together, for example, take a look at the query below:
```graphql
{
  events(
    where: {
      type_in: [
        AppliedOnOpeningEvent
        ApplicationWithdrawnEvent
        BudgetSpendingEvent
        StakeDecreasedEvent
        StakeIncreasedEvent
        OpeningAddedEvent
        OpeningCanceledEvent
        OpeningFilledEvent
        WorkerExitedEvent
        StatusTextChangedEvent
        BudgetSetEvent
        StakeSlashedEvent
        TerminatedLeaderEvent
        TerminatedWorkerEvent
      ]
    }
    limit: 25
    orderBy: [createdAt_DESC]
  ) {
    ... on AppliedOnOpeningEvent {
      ...AppliedOnOpeningEventFields
    }
    ... on ApplicationWithdrawnEvent {
      ...ApplicationWithdrawnEventFields
    }
    ... on BudgetSpendingEvent {
      ...BudgetSpendingActivityEventFields
    }
    ... on StakeDecreasedEvent {
      ...StakeDecreasedEventFields
    }
    ... on StakeIncreasedEvent {
      ...StakeIncreasedEventFields
    }
    ... on OpeningAddedEvent {
      ...OpeningAddedEventFields
    }
    ... on OpeningCanceledEvent {
      ...OpeningCanceledEventFields
    }
    ... on OpeningFilledEvent {
      ...OpeningFilledEventFields
    }
    ... on WorkerExitedEvent {
      ...WorkerExitedEventFields
    }
    ... on StatusTextChangedEvent {
      ...StatusTextChangedEventFields
    }
    ... on BudgetSetEvent {
      ...BudgetSetEventFields
    }
    ... on StakeSlashedEvent {
      ...StakeSlashedEventFields
    }
    ... on TerminatedWorkerEvent {
      ...TerminatedWorkerEventFields
    }
    ... on TerminatedLeaderEvent {
      ...TerminatedLeaderEventFields
    }
  }
}
```
There is a separate file with the events input schemas for each module that supports them:
- [`membershipEvents.graphql`](./schemas/membershipEvents.graphql)
- [`councilEvents.graphql`](./schemas/councilEvents.graphql)
- [`forumEvents.graphql`](./schemas/forumEvents.graphql)
- [`proposalsEvents.graphql`](./schemas/proposalsEvents.graphql)
- [`proposalDiscussionEvents.graphql`](./schemas/proposalDiscussionEvents.graphql)
- [`workingGroupsEvents.graphql`](./schemas/workingGroupsEvents.graphql)

### New mappings

Runtime modules for which the mappings have been introduced in Olympia (there were no mappings in Giza):
- [Council](./schemas/council.graphql)
- [Forum](./schemas/forum.graphql)
- [Proposals](./schemas/proposals.graphql)
- [Proposal discussion](./schemas/proposalDiscussion.graphql)

### Changes in existing schemas & mappings

#### [Memberships](./schemas/membership.graphql)
- `avatarUri` and `about` fields have been removed from `Membership` entity. They are now part of `MemberMetadata`, along with a new `name` field. Additionally, `avatarUri` is now of `Avatar` union type with `AvatarUri` / `AvatarObject` variants. Currently only `AvatarUri` variant is actually beeing used.
- `MembershipEntryMethod` (`Membership.entry`) is now an `union` (previously an `enum`) with 3 variants: `MembershipEntryPaid`, `MembershipEntryInvited` and `MembershipEntryGenesis`. The first two include a reference to the event which caused the membership to be created (`MembershipBoughtEvent` / `MemberInvitedEvent`)
- `createdInBlock` field has been removed from the `Membership` entity. Use `.entry.{membershipBoughtEvent|memberInvitedEvent}.inBlock` instead.
- `subscription` field has been removed.
- A lot of new fields have been added because of the introduction of the member invitations feature, referrals and other mappings with bidirectional relations to `Membership`. For reference, [see the full `Membership` schema](./schemas/membership.graphql).
- A new `MembershipSystemSnapshot` entity has been introduced which describes a snapshot of the membership system configuration parameters that can be changed through proposals. Those include default invitations count for new members, membership price, referral cut and initial balance of an invited member.

#### [Working groups](./schemas/workingGroups.graphql)
- all working groups are now supported by the query node (previously only `Gateway` and `Storage` groups were supported)
- `Worker.id` now has a `{workingGroupModuleName}-{workerId}` format, for example: `storageWorkingGroup-1`.
- `Worker.isActive` field has been removed in favor of `Worker.status` union (Note that `isActive` may be re-introduced after https://github.com/Joystream/joystream/issues/2657)
- `Worker.type` enum is now replaced by `Worker.group`, which is a reference to a new `WorkingGroup` entity. Each supported group has a corresponding `WorkingGroup` record.
- `Worker.workerId` (`String`) is now `Worker.runtimeId` (`Int`)
- `Worker.metadata` is now `Worker.storage`
- The mappings have been significantly enriched. For reference, see the [full schema](./schemas/workingGroups.graphql).
