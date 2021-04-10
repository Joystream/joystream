// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import { AnyNumber } from '@polkadot/types/types';
import { Compact, Option, Vec } from '@polkadot/types/codec';
import { Bytes, bool, u16, u32, u64 } from '@polkadot/types/primitive';
import { ActivateOpeningAt, AddOpeningParameters, ApplicationId, ApplicationIdSet, BalanceOfMint, CategoryId, ChannelCategoryCreationParameters, ChannelCategoryId, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelId, ChannelOwnershipTransferRequest, ChannelOwnershipTransferRequestId, ChannelUpdateParameters, ContentActor, ContentId, ContentParameters, CuratorGroupId, CuratorId, DataObjectStorageRelationshipId, DataObjectType, DataObjectTypeId, ElectionParameters, FillOpeningParameters, MemberId, MemoText, ObjectOwner, OpeningId, OpeningPolicyCommitment, OpeningType, PaidTermId, PersonActor, PersonCreationParameters, PersonId, PersonUpdateParameters, PlaylistCreationParameters, PlaylistId, PlaylistUpdateParameters, PostId, ProposalId, RewardPolicy, SeriesId, SeriesParameters, StorageProviderId, TerminateRoleParameters, ThreadId, VideoCategoryCreationParameters, VideoCategoryId, VideoCategoryUpdateParameters, VideoCreationParameters, VideoId, VideoUpdateParameters, VoteKind, WorkerId, WorkingGroup } from './all';
import { Extrinsic, Signature } from '@polkadot/types/interfaces/extrinsics';
import { GrandpaEquivocationProof, KeyOwnerProof } from '@polkadot/types/interfaces/grandpa';
import { Heartbeat } from '@polkadot/types/interfaces/imOnline';
import { AccountId, Balance, BalanceOf, BlockNumber, Call, ChangesTrieConfiguration, Hash, Header, KeyValue, LookupSource, Moment, Perbill, Percent, Weight } from '@polkadot/types/interfaces/runtime';
import { Keys } from '@polkadot/types/interfaces/session';
import { CompactAssignments, ElectionScore, ElectionSize, EraIndex, RewardDestination, ValidatorIndex, ValidatorPrefs } from '@polkadot/types/interfaces/staking';
import { Key } from '@polkadot/types/interfaces/system';
import { ApiTypes, SubmittableExtrinsic } from '@polkadot/api/types';

declare module '@polkadot/api/types/submittable' {
  export interface AugmentedSubmittables<ApiType> {
    authorship: {
      /**
       * Provide a set of uncles.
       **/
      setUncles: AugmentedSubmittable<(newUncles: Vec<Header> | (Header | { parentHash?: any; number?: any; stateRoot?: any; extrinsicsRoot?: any; digest?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
    };
    balances: {
      /**
       * Exactly as `transfer`, except the origin must be root and the source account may be
       * specified.
       * # <weight>
       * - Same as transfer, but additional read and write because the source account is
       * not assumed to be in the overlay.
       * # </weight>
       **/
      forceTransfer: AugmentedSubmittable<(source: LookupSource | string | Uint8Array, dest: LookupSource | string | Uint8Array, value: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set the balances of a given account.
       * 
       * This will alter `FreeBalance` and `ReservedBalance` in storage. it will
       * also decrease the total issuance of the system (`TotalIssuance`).
       * If the new free or reserved balance is below the existential deposit,
       * it will reset the account nonce (`frame_system::AccountNonce`).
       * 
       * The dispatch origin for this call is `root`.
       * 
       * # <weight>
       * - Independent of the arguments.
       * - Contains a limited number of reads and writes.
       * ---------------------
       * - Base Weight:
       * - Creating: 27.56 µs
       * - Killing: 35.11 µs
       * - DB Weight: 1 Read, 1 Write to `who`
       * # </weight>
       **/
      setBalance: AugmentedSubmittable<(who: LookupSource | string | Uint8Array, newFree: Compact<Balance> | AnyNumber | Uint8Array, newReserved: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Transfer some liquid free balance to another account.
       * 
       * `transfer` will set the `FreeBalance` of the sender and receiver.
       * It will decrease the total issuance of the system by the `TransferFee`.
       * If the sender's account is below the existential deposit as a result
       * of the transfer, the account will be reaped.
       * 
       * The dispatch origin for this call must be `Signed` by the transactor.
       * 
       * # <weight>
       * - Dependent on arguments but not critical, given proper implementations for
       * input config types. See related functions below.
       * - It contains a limited number of reads and writes internally and no complex computation.
       * 
       * Related functions:
       * 
       * - `ensure_can_withdraw` is always called internally but has a bounded complexity.
       * - Transferring balances to accounts that did not exist before will cause
       * `T::OnNewAccount::on_new_account` to be called.
       * - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
       * - `transfer_keep_alive` works the same way as `transfer`, but has an additional
       * check that the transfer will not kill the origin account.
       * ---------------------------------
       * - Base Weight: 73.64 µs, worst case scenario (account created, account removed)
       * - DB Weight: 1 Read and 1 Write to destination account
       * - Origin account is already in memory, so no DB operations for them.
       * # </weight>
       **/
      transfer: AugmentedSubmittable<(dest: LookupSource | string | Uint8Array, value: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Same as the [`transfer`] call, but with a check that the transfer will not kill the
       * origin account.
       * 
       * 99% of the time you want [`transfer`] instead.
       * 
       * [`transfer`]: struct.Module.html#method.transfer
       * # <weight>
       * - Cheaper than transfer because account cannot be killed.
       * - Base Weight: 51.4 µs
       * - DB Weight: 1 Read and 1 Write to dest (sender is in overlay already)
       * #</weight>
       **/
      transferKeepAlive: AugmentedSubmittable<(dest: LookupSource | string | Uint8Array, value: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    builderWorkingGroup: {
      /**
       * Begin accepting worker applications to an opening that is active.
       * Require signed leader origin or the root (to accept applications for the leader position).
       **/
      acceptApplications: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add an opening for a worker role.
       * Require signed leader origin or the root (to add opening for the leader position).
       **/
      addOpening: AugmentedSubmittable<(activateAt: ActivateOpeningAt | { CurrentBlock: any } | { ExactBlock: any } | string | Uint8Array, commitment: OpeningPolicyCommitment | { application_rationing_policy?: any; max_review_period_length?: any; application_staking_policy?: any; role_staking_policy?: any; role_slashing_terms?: any; fill_opening_successful_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_role_stake_unstaking_period?: any; terminate_application_stake_unstaking_period?: any; terminate_role_stake_unstaking_period?: any; exit_role_application_stake_unstaking_period?: any; exit_role_stake_unstaking_period?: any } | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader'|'Worker' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Apply on a worker opening.
       **/
      applyOnOpening: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, openingId: OpeningId | AnyNumber | Uint8Array, roleAccountId: AccountId | string | Uint8Array, optRoleStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, optApplicationStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Begin reviewing, and therefore not accepting new applications.
       * Require signed leader origin or the root (to begin review applications for the leader position).
       **/
      beginApplicantReview: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Decreases the worker/lead stake and returns the remainder to the worker role_account_id.
       * Can be decreased to zero, no actions on zero stake.
       * Require signed leader origin or the root (to decrease the leader stake).
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Fill opening for worker/lead.
       * Require signed leader origin or the root (to fill opening for the leader position).
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: ApplicationIdSet, rewardPolicy: Option<RewardPolicy> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Increases the worker/lead stake, demands a worker origin. Transfers tokens from the worker
       * role_account_id to the stake. No limits on the stake.
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Leave the role by the active worker.
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the capacity to enable working group budget. Requires root origin.
       **/
      setMintCapacity: AugmentedSubmittable<(newCapacity: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Slashes the worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Require signed leader origin or the root (to slash the leader stake).
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the worker application. Can be done by the lead only.
       **/
      terminateApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the active worker by the lead.
       * Require signed leader origin or the root (to terminate the leader role).
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array, slashStake: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward amount associated with a set reward relationship for the active worker.
       * Require signed leader origin or the root (to update leader reward amount).
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newAmount: BalanceOfMint | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role account of the active worker/lead.
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Withdraw the worker application. Can be done by the worker itself only.
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    content: {
      acceptChannelTransfer: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, requestId: ChannelOwnershipTransferRequestId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add curator to curator group under given `curator_group_id`
       **/
      addCuratorToGroup: AugmentedSubmittable<(curatorGroupId: CuratorGroupId | AnyNumber | Uint8Array, curatorId: CuratorId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      addPersonToVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array, person: PersonId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      cancelChannelTransferRequest: AugmentedSubmittable<(requestId: ChannelOwnershipTransferRequestId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      censorChannel: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      censorVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      createChannel: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, params: ChannelCreationParameters | { assets?: any; meta?: any; reward_account?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      createChannelCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, params: ChannelCategoryCreationParameters | { meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add new curator group to runtime storage
       **/
      createCuratorGroup: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      createPerson: AugmentedSubmittable<(actor: PersonActor | { Member: any } | { Curator: any } | string | Uint8Array, params: PersonCreationParameters | { assets?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      createPlaylist: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: PlaylistCreationParameters | { meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      createSeries: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: SeriesParameters | { assets?: any; seasons?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      createVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: VideoCreationParameters | { assets?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      createVideoCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, params: VideoCategoryCreationParameters | { meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      deleteChannelCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: ChannelCategoryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      deletePerson: AugmentedSubmittable<(actor: PersonActor | { Member: any } | { Curator: any } | string | Uint8Array, person: PersonId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      deletePlaylist: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, playlist: PlaylistId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      deleteSeries: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, series: SeriesId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      deleteVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      deleteVideoCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: VideoCategoryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Remove assets of a channel from storage
       **/
      removeChannelAssets: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, assets: Vec<ContentId> | (ContentId | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Remove curator from a given curator group
       **/
      removeCuratorFromGroup: AugmentedSubmittable<(curatorGroupId: CuratorGroupId | AnyNumber | Uint8Array, curatorId: CuratorId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      removePersonFromVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      requestChannelTransfer: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, request: ChannelOwnershipTransferRequest | { channel_id?: any; new_owner?: any; payment?: any; new_reward_account?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set `is_active` status for curator group under given `curator_group_id`
       **/
      setCuratorGroupStatus: AugmentedSubmittable<(curatorGroupId: CuratorGroupId | AnyNumber | Uint8Array, isActive: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setFeaturedVideos: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, list: Vec<VideoId> | (VideoId | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      uncensorChannel: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      uncensorVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      updateChannel: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: ChannelUpdateParameters | { assets?: any; new_meta?: any; reward_account?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      updateChannelCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: ChannelCategoryId | AnyNumber | Uint8Array, params: ChannelCategoryUpdateParameters | { new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      updatePerson: AugmentedSubmittable<(actor: PersonActor | { Member: any } | { Curator: any } | string | Uint8Array, person: PersonId | AnyNumber | Uint8Array, params: PersonUpdateParameters | { assets?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      updatePlaylist: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, playlist: PlaylistId | AnyNumber | Uint8Array, params: PlaylistUpdateParameters | { new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      updateSeries: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: SeriesParameters | { assets?: any; seasons?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      updateVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array, params: VideoUpdateParameters | { assets?: any; new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      updateVideoCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: VideoCategoryId | AnyNumber | Uint8Array, params: VideoCategoryUpdateParameters | { new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Begin accepting worker applications to an opening that is active.
       * Require signed leader origin or the root (to accept applications for the leader position).
       **/
      acceptApplications: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add an opening for a worker role.
       * Require signed leader origin or the root (to add opening for the leader position).
       **/
      addOpening: AugmentedSubmittable<(activateAt: ActivateOpeningAt | { CurrentBlock: any } | { ExactBlock: any } | string | Uint8Array, commitment: OpeningPolicyCommitment | { application_rationing_policy?: any; max_review_period_length?: any; application_staking_policy?: any; role_staking_policy?: any; role_slashing_terms?: any; fill_opening_successful_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_role_stake_unstaking_period?: any; terminate_application_stake_unstaking_period?: any; terminate_role_stake_unstaking_period?: any; exit_role_application_stake_unstaking_period?: any; exit_role_stake_unstaking_period?: any } | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader'|'Worker' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Apply on a worker opening.
       **/
      applyOnOpening: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, openingId: OpeningId | AnyNumber | Uint8Array, roleAccountId: AccountId | string | Uint8Array, optRoleStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, optApplicationStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Begin reviewing, and therefore not accepting new applications.
       * Require signed leader origin or the root (to begin review applications for the leader position).
       **/
      beginApplicantReview: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Decreases the worker/lead stake and returns the remainder to the worker role_account_id.
       * Can be decreased to zero, no actions on zero stake.
       * Require signed leader origin or the root (to decrease the leader stake).
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Fill opening for worker/lead.
       * Require signed leader origin or the root (to fill opening for the leader position).
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: ApplicationIdSet, rewardPolicy: Option<RewardPolicy> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Increases the worker/lead stake, demands a worker origin. Transfers tokens from the worker
       * role_account_id to the stake. No limits on the stake.
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Leave the role by the active worker.
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the capacity to enable working group budget. Requires root origin.
       **/
      setMintCapacity: AugmentedSubmittable<(newCapacity: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Slashes the worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Require signed leader origin or the root (to slash the leader stake).
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the worker application. Can be done by the lead only.
       **/
      terminateApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the active worker by the lead.
       * Require signed leader origin or the root (to terminate the leader role).
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array, slashStake: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward amount associated with a set reward relationship for the active worker.
       * Require signed leader origin or the root (to update leader reward amount).
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newAmount: BalanceOfMint | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role account of the active worker/lead.
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Withdraw the worker application. Can be done by the worker itself only.
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    council: {
      /**
       * Adds a zero staked council member. A member added in this way does not get a recurring reward.
       **/
      addCouncilMember: AugmentedSubmittable<(account: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Remove a single council member and their reward.
       **/
      removeCouncilMember: AugmentedSubmittable<(accountToRemove: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Force set a zero staked council. Stakes in existing council seats are not returned.
       * Existing council rewards are removed and new council members do NOT get any rewards.
       * Avoid using this call if possible, will be deprecated. The term of the new council is
       * not extended.
       **/
      setCouncil: AugmentedSubmittable<(accounts: Vec<AccountId> | (AccountId | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the capacity of the the council mint, if it doesn't exist, attempts to
       * create a new one.
       **/
      setCouncilMintCapacity: AugmentedSubmittable<(capacity: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the council rewards which is only applied on new council being elected.
       **/
      setCouncilRewards: AugmentedSubmittable<(amountPerPayout: BalanceOf | AnyNumber | Uint8Array, payoutInterval: Option<BlockNumber> | null | object | string | Uint8Array, firstPayoutAfterRewardCreated: BlockNumber | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set blocknumber when council term will end
       **/
      setTermEndsAt: AugmentedSubmittable<(endsAt: BlockNumber | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Attempts to mint and transfer amount to destination account
       **/
      spendFromCouncilMint: AugmentedSubmittable<(amount: BalanceOf | AnyNumber | Uint8Array, destination: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    councilElection: {
      apply: AugmentedSubmittable<(stake: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      forceStartElection: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      forceStopElection: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      reveal: AugmentedSubmittable<(commitment: Hash | string | Uint8Array, vote: AccountId | string | Uint8Array, salt: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setAutoStart: AugmentedSubmittable<(flag: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets new election parameters. Some combination of parameters that are not desirable, so
       * the parameters are checked for validity.
       * The call will fail if an election is in progress. If a council is not being elected for some
       * reaon after multiple rounds, force_stop_election() can be called to stop elections and followed by
       * set_election_parameters().
       **/
      setElectionParameters: AugmentedSubmittable<(params: ElectionParameters | { announcing_period?: any; voting_period?: any; revealing_period?: any; council_size?: any; candidacy_limit?: any; new_term_duration?: any; min_council_stake?: any; min_voting_stake?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setStageAnnouncing: AugmentedSubmittable<(endsAt: BlockNumber | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setStageRevealing: AugmentedSubmittable<(endsAt: BlockNumber | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setStageVoting: AugmentedSubmittable<(endsAt: BlockNumber | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      vote: AugmentedSubmittable<(commitment: Hash | string | Uint8Array, stake: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    dataDirectory: {
      /**
       * Storage provider accepts a content. Requires signed storage provider account and its id.
       * The LiaisonJudgement can only be updated once from Pending to Accepted.
       * Subsequent calls are a no-op.
       **/
      acceptContent: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, contentId: ContentId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Adds the content to the system. The created DataObject
       * awaits liaison to accept it.
       **/
      addContent: AugmentedSubmittable<(owner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, content: Vec<ContentParameters> | (ContentParameters | { content_id?: any; type_id?: any; ipfs_content_id?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Remove the content from the system.
       **/
      removeContent: AugmentedSubmittable<(owner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, contentIds: Vec<ContentId> | (ContentId | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set the default owner voucher
       **/
      setDefaultVoucher: AugmentedSubmittable<(sizeLimit: u64 | AnyNumber | Uint8Array, objectsLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets global voucher objects limit. Requires root privileges.
       * New limit cannot be less that used value.
       **/
      setGlobalVoucherObjectsLimit: AugmentedSubmittable<(newObjectsLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets global voucher size limit. Requires root privileges.
       * New limit cannot be less that used value.
       **/
      setGlobalVoucherSizeLimit: AugmentedSubmittable<(newSizeLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets VoucherObjectsLimitUpperBound. Requires root privileges.
       **/
      setVoucherObjectsLimitUpperBound: AugmentedSubmittable<(newUpperBound: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets VoucherSizeLimitUpperBound. Requires root privileges.
       **/
      setVoucherSizeLimitUpperBound: AugmentedSubmittable<(newUpperBound: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Locks / unlocks content uploading
       **/
      updateContentUploadingStatus: AugmentedSubmittable<(isBlocked: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Updates storage object owner voucher objects limit. Requires leader privileges.
       * New limit cannot be less that used value.
       **/
      updateStorageObjectOwnerVoucherObjectsLimit: AugmentedSubmittable<(objectOwner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, newVoucherObjectsLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Updates storage object owner voucher size limit. Requires leader privileges.
       * New limit cannot be less that used value.
       **/
      updateStorageObjectOwnerVoucherSizeLimit: AugmentedSubmittable<(objectOwner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, newVoucherSizeLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    dataObjectStorageRegistry: {
      /**
       * Add storage provider-to-content relationship. The storage provider should be registered
       * in the storage working group.
       **/
      addRelationship: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, cid: ContentId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Activates storage provider-to-content relationship. The storage provider should be registered
       * in the storage working group. A storage provider may flip their own ready state, but nobody else.
       **/
      setRelationshipReady: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, id: DataObjectStorageRelationshipId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Deactivates storage provider-to-content relationship. The storage provider should be registered
       * in the storage working group. A storage provider may flip their own ready state, but nobody else.
       **/
      unsetRelationshipReady: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, id: DataObjectStorageRelationshipId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    dataObjectTypeRegistry: {
      /**
       * Activates existing data object type. Requires leader privileges.
       **/
      activateDataObjectType: AugmentedSubmittable<(id: DataObjectTypeId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Deactivates existing data object type. Requires leader privileges.
       **/
      deactivateDataObjectType: AugmentedSubmittable<(id: DataObjectTypeId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Registers the new data object type. Requires leader privileges.
       **/
      registerDataObjectType: AugmentedSubmittable<(dataObjectType: DataObjectType | { description?: any; active?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Updates existing data object type. Requires leader privileges.
       **/
      updateDataObjectType: AugmentedSubmittable<(id: DataObjectTypeId | AnyNumber | Uint8Array, dataObjectType: DataObjectType | { description?: any; active?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    finalityTracker: {
      /**
       * Hint that the author of this block thinks the best finalized
       * block is the given number.
       **/
      finalHint: AugmentedSubmittable<(hint: Compact<BlockNumber> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    forum: {
      /**
       * Edit post text
       **/
      addPost: AugmentedSubmittable<(threadId: ThreadId | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add a new category.
       **/
      createCategory: AugmentedSubmittable<(parent: Option<CategoryId> | null | object | string | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create new thread in category
       **/
      createThread: AugmentedSubmittable<(categoryId: CategoryId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Edit post text
       **/
      editPostText: AugmentedSubmittable<(postId: PostId | AnyNumber | Uint8Array, newText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Moderate post
       **/
      moderatePost: AugmentedSubmittable<(postId: PostId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Moderate thread
       **/
      moderateThread: AugmentedSubmittable<(threadId: ThreadId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set forum sudo.
       **/
      setForumSudo: AugmentedSubmittable<(newForumSudo: Option<AccountId> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update category
       **/
      updateCategory: AugmentedSubmittable<(categoryId: CategoryId | AnyNumber | Uint8Array, newArchivalStatus: Option<bool> | null | object | string | Uint8Array, newDeletionStatus: Option<bool> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    gatewayWorkingGroup: {
      /**
       * Begin accepting worker applications to an opening that is active.
       * Require signed leader origin or the root (to accept applications for the leader position).
       **/
      acceptApplications: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add an opening for a worker role.
       * Require signed leader origin or the root (to add opening for the leader position).
       **/
      addOpening: AugmentedSubmittable<(activateAt: ActivateOpeningAt | { CurrentBlock: any } | { ExactBlock: any } | string | Uint8Array, commitment: OpeningPolicyCommitment | { application_rationing_policy?: any; max_review_period_length?: any; application_staking_policy?: any; role_staking_policy?: any; role_slashing_terms?: any; fill_opening_successful_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_role_stake_unstaking_period?: any; terminate_application_stake_unstaking_period?: any; terminate_role_stake_unstaking_period?: any; exit_role_application_stake_unstaking_period?: any; exit_role_stake_unstaking_period?: any } | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader'|'Worker' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Apply on a worker opening.
       **/
      applyOnOpening: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, openingId: OpeningId | AnyNumber | Uint8Array, roleAccountId: AccountId | string | Uint8Array, optRoleStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, optApplicationStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Begin reviewing, and therefore not accepting new applications.
       * Require signed leader origin or the root (to begin review applications for the leader position).
       **/
      beginApplicantReview: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Decreases the worker/lead stake and returns the remainder to the worker role_account_id.
       * Can be decreased to zero, no actions on zero stake.
       * Require signed leader origin or the root (to decrease the leader stake).
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Fill opening for worker/lead.
       * Require signed leader origin or the root (to fill opening for the leader position).
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: ApplicationIdSet, rewardPolicy: Option<RewardPolicy> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Increases the worker/lead stake, demands a worker origin. Transfers tokens from the worker
       * role_account_id to the stake. No limits on the stake.
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Leave the role by the active worker.
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the capacity to enable working group budget. Requires root origin.
       **/
      setMintCapacity: AugmentedSubmittable<(newCapacity: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Slashes the worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Require signed leader origin or the root (to slash the leader stake).
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the worker application. Can be done by the lead only.
       **/
      terminateApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the active worker by the lead.
       * Require signed leader origin or the root (to terminate the leader role).
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array, slashStake: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward amount associated with a set reward relationship for the active worker.
       * Require signed leader origin or the root (to update leader reward amount).
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newAmount: BalanceOfMint | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role account of the active worker/lead.
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Withdraw the worker application. Can be done by the worker itself only.
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    grandpa: {
      /**
       * Report voter equivocation/misbehavior. This method will verify the
       * equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence
       * will be reported.
       * 
       * Since the weight of the extrinsic is 0, in order to avoid DoS by
       * submission of invalid equivocation reports, a mandatory pre-validation of
       * the extrinsic is implemented in a `SignedExtension`.
       **/
      reportEquivocation: AugmentedSubmittable<(equivocationProof: GrandpaEquivocationProof | { setId?: any; equivocation?: any } | string | Uint8Array, keyOwnerProof: KeyOwnerProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    imOnline: {
      /**
       * # <weight>
       * - Complexity: `O(K + E)` where K is length of `Keys` and E is length of
       * `Heartbeat.network_state.external_address`
       * 
       * - `O(K)`: decoding of length `K`
       * - `O(E)`: decoding/encoding of length `E`
       * - DbReads: pallet_session `Validators`, pallet_session `CurrentIndex`, `Keys`,
       * `ReceivedHeartbeats`
       * - DbWrites: `ReceivedHeartbeats`
       * # </weight>
       **/
      heartbeat: AugmentedSubmittable<(heartbeat: Heartbeat | { blockNumber?: any; networkState?: any; sessionIndex?: any; authorityIndex?: any; validatorsLen?: any } | string | Uint8Array, signature: Signature | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    members: {
      /**
       * Screened members are awarded a initial locked balance that can only be slashed or used
       * for fees, and is not transferable. The screening authority must ensure that the provided
       * new_member_account was verified to avoid applying locks arbitrarily to accounts not controlled
       * by the member.
       **/
      addScreenedMember: AugmentedSubmittable<(newMemberAccount: AccountId | string | Uint8Array, handle: Option<Bytes> | null | object | string | Uint8Array, avatarUri: Option<Bytes> | null | object | string | Uint8Array, about: Option<Bytes> | null | object | string | Uint8Array, initialBalance: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Non-members can buy membership
       **/
      buyMembership: AugmentedSubmittable<(paidTermsId: PaidTermId | AnyNumber | Uint8Array, handle: Option<Bytes> | null | object | string | Uint8Array, avatarUri: Option<Bytes> | null | object | string | Uint8Array, about: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Change member's about text
       **/
      changeMemberAboutText: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Change member's avatar
       **/
      changeMemberAvatar: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, uri: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Change member's handle. Will ensure new handle is unique and old one will be available
       * for other members to use.
       **/
      changeMemberHandle: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, handle: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setControllerAccount: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, newControllerAccount: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setRootAccount: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, newRootAccount: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      setScreeningAuthority: AugmentedSubmittable<(authority: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update member's all or some of handle, avatar and about text.
       **/
      updateMembership: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, handle: Option<Bytes> | null | object | string | Uint8Array, avatarUri: Option<Bytes> | null | object | string | Uint8Array, about: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    memo: {
      updateMemo: AugmentedSubmittable<(memo: MemoText | string) => SubmittableExtrinsic<ApiType>>;
    };
    proposalsCodex: {
      /**
       * Create 'Add working group leader opening' proposal type.
       * This proposal uses `add_opening()` extrinsic from the Joystream `working group` module.
       **/
      createAddWorkingGroupLeaderOpeningProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, addOpeningParameters: AddOpeningParameters | { activate_at?: any; commitment?: any; human_readable_text?: any; working_group?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Begin review working group leader applications' proposal type.
       * This proposal uses `begin_applicant_review()` extrinsic from the Joystream `working group` module.
       **/
      createBeginReviewWorkingGroupLeaderApplicationsProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, openingId: OpeningId | AnyNumber | Uint8Array, workingGroup: WorkingGroup | 'Storage'|'Content'|'Operations'|'Gateway' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'decrease working group leader stake' proposal type.
       * This proposal uses `decrease_stake()` extrinsic from the `working-group`  module.
       **/
      createDecreaseWorkingGroupLeaderStakeProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, workerId: WorkerId | AnyNumber | Uint8Array, decreasingStake: BalanceOf | AnyNumber | Uint8Array, workingGroup: WorkingGroup | 'Storage'|'Content'|'Operations'|'Gateway' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Fill working group leader opening' proposal type.
       * This proposal uses `fill_opening()` extrinsic from the Joystream `working group` module.
       **/
      createFillWorkingGroupLeaderOpeningProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, fillOpeningParameters: FillOpeningParameters | { opening_id?: any; successful_application_id?: any; reward_policy?: any; working_group?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Runtime upgrade' proposal type. Runtime upgrade can be initiated only by
       * members from the hardcoded list `RuntimeUpgradeProposalAllowedProposers`
       **/
      createRuntimeUpgradeProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, wasm: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Set election parameters' proposal type. This proposal uses `set_election_parameters()`
       * extrinsic from the `governance::election module`.
       **/
      createSetElectionParametersProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, electionParameters: ElectionParameters | { announcing_period?: any; voting_period?: any; revealing_period?: any; council_size?: any; candidacy_limit?: any; new_term_duration?: any; min_council_stake?: any; min_voting_stake?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Evict storage provider' proposal type.
       * This proposal uses `set_validator_count()` extrinsic from the Substrate `staking`  module.
       **/
      createSetValidatorCountProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, newValidatorCount: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'set working group leader reward' proposal type.
       * This proposal uses `update_reward_amount()` extrinsic from the `working-group`  module.
       **/
      createSetWorkingGroupLeaderRewardProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, workerId: WorkerId | AnyNumber | Uint8Array, rewardAmount: BalanceOfMint | AnyNumber | Uint8Array, workingGroup: WorkingGroup | 'Storage'|'Content'|'Operations'|'Gateway' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Set working group mint capacity' proposal type.
       * This proposal uses `set_mint_capacity()` extrinsic from the `working-group`  module.
       **/
      createSetWorkingGroupMintCapacityProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, mintBalance: BalanceOfMint | AnyNumber | Uint8Array, workingGroup: WorkingGroup | 'Storage'|'Content'|'Operations'|'Gateway' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'slash working group leader stake' proposal type.
       * This proposal uses `slash_stake()` extrinsic from the `working-group`  module.
       **/
      createSlashWorkingGroupLeaderStakeProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, workerId: WorkerId | AnyNumber | Uint8Array, slashingStake: BalanceOf | AnyNumber | Uint8Array, workingGroup: WorkingGroup | 'Storage'|'Content'|'Operations'|'Gateway' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Spending' proposal type.
       * This proposal uses `spend_from_council_mint()` extrinsic from the `governance::council`  module.
       **/
      createSpendingProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, balance: BalanceOfMint | AnyNumber | Uint8Array, destination: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'terminate working group leader rolw' proposal type.
       * This proposal uses `terminate_role()` extrinsic from the `working-group`  module.
       **/
      createTerminateWorkingGroupLeaderRoleProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, terminateRoleParameters: TerminateRoleParameters | { worker_id?: any; rationale?: any; slash?: any; working_group?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Create 'Text (signal)' proposal type.
       **/
      createTextProposal: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array, stakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Runtime upgrade proposal extrinsic.
       * Should be used as callable object to pass to the `engine` module.
       **/
      executeRuntimeUpgradeProposal: AugmentedSubmittable<(wasm: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Text proposal extrinsic. Should be used as callable object to pass to the `engine` module.
       **/
      executeTextProposal: AugmentedSubmittable<(text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    proposalsDiscussion: {
      /**
       * Adds a post with author origin check.
       **/
      addPost: AugmentedSubmittable<(postAuthorId: MemberId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Updates a post with author origin check. Update attempts number is limited.
       **/
      updatePost: AugmentedSubmittable<(postAuthorId: MemberId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    proposalsEngine: {
      /**
       * Cancel a proposal by its original proposer.
       **/
      cancelProposal: AugmentedSubmittable<(proposerId: MemberId | AnyNumber | Uint8Array, proposalId: ProposalId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Veto a proposal. Must be root.
       **/
      vetoProposal: AugmentedSubmittable<(proposalId: ProposalId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Vote extrinsic. Conditions:  origin must allow votes.
       **/
      vote: AugmentedSubmittable<(voterId: MemberId | AnyNumber | Uint8Array, proposalId: ProposalId | AnyNumber | Uint8Array, vote: VoteKind | 'Approve'|'Reject'|'Slash'|'Abstain' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    session: {
      /**
       * Removes any session key(s) of the function caller.
       * This doesn't take effect until the next session.
       * 
       * The dispatch origin of this function must be signed.
       * 
       * # <weight>
       * - Complexity: `O(1)` in number of key types.
       * Actual cost depends on the number of length of `T::Keys::key_ids()` which is fixed.
       * - DbReads: `T::ValidatorIdOf`, `NextKeys`, `origin account`
       * - DbWrites: `NextKeys`, `origin account`
       * - DbWrites per key id: `KeyOwnder`
       * # </weight>
       **/
      purgeKeys: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the session key(s) of the function caller to `keys`.
       * Allows an account to set its session key prior to becoming a validator.
       * This doesn't take effect until the next session.
       * 
       * The dispatch origin of this function must be signed.
       * 
       * # <weight>
       * - Complexity: `O(1)`
       * Actual cost depends on the number of length of `T::Keys::key_ids()` which is fixed.
       * - DbReads: `origin account`, `T::ValidatorIdOf`, `NextKeys`
       * - DbWrites: `origin account`, `NextKeys`
       * - DbReads per key id: `KeyOwner`
       * - DbWrites per key id: `KeyOwner`
       * # </weight>
       **/
      setKeys: AugmentedSubmittable<(keys: Keys, proof: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    staking: {
      /**
       * Take the origin account as a stash and lock up `value` of its balance. `controller` will
       * be the account that controls it.
       * 
       * `value` must be more than the `minimum_balance` specified by `T::Currency`.
       * 
       * The dispatch origin for this call must be _Signed_ by the stash account.
       * 
       * Emits `Bonded`.
       * 
       * # <weight>
       * - Independent of the arguments. Moderate complexity.
       * - O(1).
       * - Three extra DB entries.
       * 
       * NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned
       * unless the `origin` falls below _existential deposit_ and gets removed as dust.
       * ------------------
       * Base Weight: 67.87 µs
       * DB Weight:
       * - Read: Bonded, Ledger, [Origin Account], Current Era, History Depth, Locks
       * - Write: Bonded, Payee, [Origin Account], Locks, Ledger
       * # </weight>
       **/
      bond: AugmentedSubmittable<(controller: LookupSource | string | Uint8Array, value: Compact<BalanceOf> | AnyNumber | Uint8Array, payee: RewardDestination | 'Staked'|'Stash'|'Controller' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add some extra amount that have appeared in the stash `free_balance` into the balance up
       * for staking.
       * 
       * Use this if there are additional funds in your stash account that you wish to bond.
       * Unlike [`bond`] or [`unbond`] this function does not impose any limitation on the amount
       * that can be added.
       * 
       * The dispatch origin for this call must be _Signed_ by the stash, not the controller and
       * it can be only called when [`EraElectionStatus`] is `Closed`.
       * 
       * Emits `Bonded`.
       * 
       * # <weight>
       * - Independent of the arguments. Insignificant complexity.
       * - O(1).
       * - One DB entry.
       * ------------
       * Base Weight: 54.88 µs
       * DB Weight:
       * - Read: Era Election Status, Bonded, Ledger, [Origin Account], Locks
       * - Write: [Origin Account], Locks, Ledger
       * # </weight>
       **/
      bondExtra: AugmentedSubmittable<(maxAdditional: Compact<BalanceOf> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Cancel enactment of a deferred slash.
       * 
       * Can be called by the `T::SlashCancelOrigin`.
       * 
       * Parameters: era and indices of the slashes for that era to kill.
       * 
       * # <weight>
       * Complexity: O(U + S)
       * with U unapplied slashes weighted with U=1000
       * and S is the number of slash indices to be canceled.
       * - Base: 5870 + 34.61 * S µs
       * - Read: Unapplied Slashes
       * - Write: Unapplied Slashes
       * # </weight>
       **/
      cancelDeferredSlash: AugmentedSubmittable<(era: EraIndex | AnyNumber | Uint8Array, slashIndices: Vec<u32> | (u32 | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Declare no desire to either validate or nominate.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * And, it can be only called when [`EraElectionStatus`] is `Closed`.
       * 
       * # <weight>
       * - Independent of the arguments. Insignificant complexity.
       * - Contains one read.
       * - Writes are limited to the `origin` account key.
       * --------
       * Base Weight: 16.53 µs
       * DB Weight:
       * - Read: EraElectionStatus, Ledger
       * - Write: Validators, Nominators
       * # </weight>
       **/
      chill: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      /**
       * Force there to be a new era at the end of the next session. After this, it will be
       * reset to normal (non-forced) behaviour.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - No arguments.
       * - Base Weight: 1.959 µs
       * - Write ForceEra
       * # </weight>
       **/
      forceNewEra: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      /**
       * Force there to be a new era at the end of sessions indefinitely.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - Base Weight: 2.05 µs
       * - Write: ForceEra
       * # </weight>
       **/
      forceNewEraAlways: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      /**
       * Force there to be no new eras indefinitely.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - No arguments.
       * - Base Weight: 1.857 µs
       * - Write: ForceEra
       * # </weight>
       **/
      forceNoEras: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
      /**
       * Force a current staker to become completely unstaked, immediately.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * O(S) where S is the number of slashing spans to be removed
       * Base Weight: 53.07 + 2.365 * S µs
       * Reads: Bonded, Slashing Spans, Account, Locks
       * Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Account, Locks
       * Writes Each: SpanSlash * S
       * # </weight>
       **/
      forceUnstake: AugmentedSubmittable<(stash: AccountId | string | Uint8Array, numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Increments the ideal number of validators.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Base Weight: 1.717 µs
       * Read/Write: Validator Count
       * # </weight>
       **/
      increaseValidatorCount: AugmentedSubmittable<(additional: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Declare the desire to nominate `targets` for the origin controller.
       * 
       * Effects will be felt at the beginning of the next era. This can only be called when
       * [`EraElectionStatus`] is `Closed`.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * And, it can be only called when [`EraElectionStatus`] is `Closed`.
       * 
       * # <weight>
       * - The transaction's complexity is proportional to the size of `targets` (N)
       * which is capped at CompactAssignments::LIMIT (MAX_NOMINATIONS).
       * - Both the reads and writes follow a similar pattern.
       * ---------
       * Base Weight: 22.34 + .36 * N µs
       * where N is the number of targets
       * DB Weight:
       * - Reads: Era Election Status, Ledger, Current Era
       * - Writes: Validators, Nominators
       * # </weight>
       **/
      nominate: AugmentedSubmittable<(targets: Vec<LookupSource> | (LookupSource | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Pay out all the stakers behind a single validator for a single era.
       * 
       * - `validator_stash` is the stash account of the validator. Their nominators, up to
       * `T::MaxNominatorRewardedPerValidator`, will also receive their rewards.
       * - `era` may be any era between `[current_era - history_depth; current_era]`.
       * 
       * The origin of this call must be _Signed_. Any account can call this function, even if
       * it is not one of the stakers.
       * 
       * This can only be called when [`EraElectionStatus`] is `Closed`.
       * 
       * # <weight>
       * - Time complexity: at most O(MaxNominatorRewardedPerValidator).
       * - Contains a limited number of reads and writes.
       * -----------
       * N is the Number of payouts for the validator (including the validator)
       * Base Weight:
       * - Reward Destination Staked: 110 + 54.2 * N µs (Median Slopes)
       * - Reward Destination Controller (Creating): 120 + 41.95 * N µs (Median Slopes)
       * DB Weight:
       * - Read: EraElectionStatus, CurrentEra, HistoryDepth, ErasValidatorReward,
       * ErasStakersClipped, ErasRewardPoints, ErasValidatorPrefs (8 items)
       * - Read Each: Bonded, Ledger, Payee, Locks, System Account (5 items)
       * - Write Each: System Account, Locks, Ledger (3 items)
       * # </weight>
       **/
      payoutStakers: AugmentedSubmittable<(validatorStash: AccountId | string | Uint8Array, era: EraIndex | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Remove all data structure concerning a staker/stash once its balance is zero.
       * This is essentially equivalent to `withdraw_unbonded` except it can be called by anyone
       * and the target `stash` must have no funds left.
       * 
       * This can be called from any origin.
       * 
       * - `stash`: The stash account to reap. Its balance must be zero.
       * 
       * # <weight>
       * Complexity: O(S) where S is the number of slashing spans on the account.
       * Base Weight: 75.94 + 2.396 * S µs
       * DB Weight:
       * - Reads: Stash Account, Bonded, Slashing Spans, Locks
       * - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Stash Account, Locks
       * - Writes Each: SpanSlash * S
       * # </weight>
       **/
      reapStash: AugmentedSubmittable<(stash: AccountId | string | Uint8Array, numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Rebond a portion of the stash scheduled to be unlocked.
       * 
       * The dispatch origin must be signed by the controller, and it can be only called when
       * [`EraElectionStatus`] is `Closed`.
       * 
       * # <weight>
       * - Time complexity: O(L), where L is unlocking chunks
       * - Bounded by `MAX_UNLOCKING_CHUNKS`.
       * - Storage changes: Can't increase storage, only decrease it.
       * ---------------
       * - Base Weight: 34.51 µs * .048 L µs
       * - DB Weight:
       * - Reads: EraElectionStatus, Ledger, Locks, [Origin Account]
       * - Writes: [Origin Account], Locks, Ledger
       * # </weight>
       **/
      rebond: AugmentedSubmittable<(value: Compact<BalanceOf> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Scale up the ideal number of validators by a factor.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Base Weight: 1.717 µs
       * Read/Write: Validator Count
       * # </weight>
       **/
      scaleValidatorCount: AugmentedSubmittable<(factor: Percent | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * (Re-)set the controller of a stash.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the stash, not the controller.
       * 
       * # <weight>
       * - Independent of the arguments. Insignificant complexity.
       * - Contains a limited number of reads.
       * - Writes are limited to the `origin` account key.
       * ----------
       * Base Weight: 25.22 µs
       * DB Weight:
       * - Read: Bonded, Ledger New Controller, Ledger Old Controller
       * - Write: Bonded, Ledger New Controller, Ledger Old Controller
       * # </weight>
       **/
      setController: AugmentedSubmittable<(controller: LookupSource | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set `HistoryDepth` value. This function will delete any history information
       * when `HistoryDepth` is reduced.
       * 
       * Parameters:
       * - `new_history_depth`: The new history depth you would like to set.
       * - `era_items_deleted`: The number of items that will be deleted by this dispatch.
       * This should report all the storage items that will be deleted by clearing old
       * era history. Needed to report an accurate weight for the dispatch. Trusted by
       * `Root` to report an accurate number.
       * 
       * Origin must be root.
       * 
       * # <weight>
       * - E: Number of history depths removed, i.e. 10 -> 7 = 3
       * - Base Weight: 29.13 * E µs
       * - DB Weight:
       * - Reads: Current Era, History Depth
       * - Writes: History Depth
       * - Clear Prefix Each: Era Stakers, EraStakersClipped, ErasValidatorPrefs
       * - Writes Each: ErasValidatorReward, ErasRewardPoints, ErasTotalStake, ErasStartSessionIndex
       * # </weight>
       **/
      setHistoryDepth: AugmentedSubmittable<(newHistoryDepth: Compact<EraIndex> | AnyNumber | Uint8Array, eraItemsDeleted: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set the validators who cannot be slashed (if any).
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - O(V)
       * - Base Weight: 2.208 + .006 * V µs
       * - Write: Invulnerables
       * # </weight>
       **/
      setInvulnerables: AugmentedSubmittable<(validators: Vec<AccountId> | (AccountId | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * (Re-)set the payment target for a controller.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * 
       * # <weight>
       * - Independent of the arguments. Insignificant complexity.
       * - Contains a limited number of reads.
       * - Writes are limited to the `origin` account key.
       * ---------
       * - Base Weight: 11.33 µs
       * - DB Weight:
       * - Read: Ledger
       * - Write: Payee
       * # </weight>
       **/
      setPayee: AugmentedSubmittable<(payee: RewardDestination | 'Staked'|'Stash'|'Controller' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the ideal number of validators.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Base Weight: 1.717 µs
       * Write: Validator Count
       * # </weight>
       **/
      setValidatorCount: AugmentedSubmittable<(updated: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Submit an election result to the chain. If the solution:
       * 
       * 1. is valid.
       * 2. has a better score than a potentially existing solution on chain.
       * 
       * then, it will be _put_ on chain.
       * 
       * A solution consists of two pieces of data:
       * 
       * 1. `winners`: a flat vector of all the winners of the round.
       * 2. `assignments`: the compact version of an assignment vector that encodes the edge
       * weights.
       * 
       * Both of which may be computed using _phragmen_, or any other algorithm.
       * 
       * Additionally, the submitter must provide:
       * 
       * - The `score` that they claim their solution has.
       * 
       * Both validators and nominators will be represented by indices in the solution. The
       * indices should respect the corresponding types ([`ValidatorIndex`] and
       * [`NominatorIndex`]). Moreover, they should be valid when used to index into
       * [`SnapshotValidators`] and [`SnapshotNominators`]. Any invalid index will cause the
       * solution to be rejected. These two storage items are set during the election window and
       * may be used to determine the indices.
       * 
       * A solution is valid if:
       * 
       * 0. It is submitted when [`EraElectionStatus`] is `Open`.
       * 1. Its claimed score is equal to the score computed on-chain.
       * 2. Presents the correct number of winners.
       * 3. All indexes must be value according to the snapshot vectors. All edge values must
       * also be correct and should not overflow the granularity of the ratio type (i.e. 256
       * or billion).
       * 4. For each edge, all targets are actually nominated by the voter.
       * 5. Has correct self-votes.
       * 
       * A solutions score is consisted of 3 parameters:
       * 
       * 1. `min { support.total }` for each support of a winner. This value should be maximized.
       * 2. `sum { support.total }` for each support of a winner. This value should be minimized.
       * 3. `sum { support.total^2 }` for each support of a winner. This value should be
       * minimized (to ensure less variance)
       * 
       * # <weight>
       * See `crate::weight` module.
       * # </weight>
       **/
      submitElectionSolution: AugmentedSubmittable<(winners: Vec<ValidatorIndex> | (ValidatorIndex | AnyNumber | Uint8Array)[], compact: CompactAssignments | { votes1?: any; votes2?: any; votes3?: any; votes4?: any; votes5?: any; votes6?: any; votes7?: any; votes8?: any; votes9?: any; votes10?: any; votes11?: any; votes12?: any; votes13?: any; votes14?: any; votes15?: any; votes16?: any } | string | Uint8Array, score: ElectionScore, era: EraIndex | AnyNumber | Uint8Array, size: ElectionSize | { validators?: any; nominators?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Unsigned version of `submit_election_solution`.
       * 
       * Note that this must pass the [`ValidateUnsigned`] check which only allows transactions
       * from the local node to be included. In other words, only the block author can include a
       * transaction in the block.
       * 
       * # <weight>
       * See `crate::weight` module.
       * # </weight>
       **/
      submitElectionSolutionUnsigned: AugmentedSubmittable<(winners: Vec<ValidatorIndex> | (ValidatorIndex | AnyNumber | Uint8Array)[], compact: CompactAssignments | { votes1?: any; votes2?: any; votes3?: any; votes4?: any; votes5?: any; votes6?: any; votes7?: any; votes8?: any; votes9?: any; votes10?: any; votes11?: any; votes12?: any; votes13?: any; votes14?: any; votes15?: any; votes16?: any } | string | Uint8Array, score: ElectionScore, era: EraIndex | AnyNumber | Uint8Array, size: ElectionSize | { validators?: any; nominators?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Schedule a portion of the stash to be unlocked ready for transfer out after the bond
       * period ends. If this leaves an amount actively bonded less than
       * T::Currency::minimum_balance(), then it is increased to the full amount.
       * 
       * Once the unlock period is done, you can call `withdraw_unbonded` to actually move
       * the funds out of management ready for transfer.
       * 
       * No more than a limited number of unlocking chunks (see `MAX_UNLOCKING_CHUNKS`)
       * can co-exists at the same time. In that case, [`Call::withdraw_unbonded`] need
       * to be called first to remove some of the chunks (if possible).
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * And, it can be only called when [`EraElectionStatus`] is `Closed`.
       * 
       * Emits `Unbonded`.
       * 
       * See also [`Call::withdraw_unbonded`].
       * 
       * # <weight>
       * - Independent of the arguments. Limited but potentially exploitable complexity.
       * - Contains a limited number of reads.
       * - Each call (requires the remainder of the bonded balance to be above `minimum_balance`)
       * will cause a new entry to be inserted into a vector (`Ledger.unlocking`) kept in storage.
       * The only way to clean the aforementioned storage item is also user-controlled via
       * `withdraw_unbonded`.
       * - One DB entry.
       * ----------
       * Base Weight: 50.34 µs
       * DB Weight:
       * - Read: Era Election Status, Ledger, Current Era, Locks, [Origin Account]
       * - Write: [Origin Account], Locks, Ledger
       * </weight>
       **/
      unbond: AugmentedSubmittable<(value: Compact<BalanceOf> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Declare the desire to validate for the origin controller.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * And, it can be only called when [`EraElectionStatus`] is `Closed`.
       * 
       * # <weight>
       * - Independent of the arguments. Insignificant complexity.
       * - Contains a limited number of reads.
       * - Writes are limited to the `origin` account key.
       * -----------
       * Base Weight: 17.13 µs
       * DB Weight:
       * - Read: Era Election Status, Ledger
       * - Write: Nominators, Validators
       * # </weight>
       **/
      validate: AugmentedSubmittable<(prefs: ValidatorPrefs | { commission?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Remove any unlocked chunks from the `unlocking` queue from our management.
       * 
       * This essentially frees up that balance to be used by the stash account to do
       * whatever it wants.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * And, it can be only called when [`EraElectionStatus`] is `Closed`.
       * 
       * Emits `Withdrawn`.
       * 
       * See also [`Call::unbond`].
       * 
       * # <weight>
       * - Could be dependent on the `origin` argument and how much `unlocking` chunks exist.
       * It implies `consolidate_unlocked` which loops over `Ledger.unlocking`, which is
       * indirectly user-controlled. See [`unbond`] for more detail.
       * - Contains a limited number of reads, yet the size of which could be large based on `ledger`.
       * - Writes are limited to the `origin` account key.
       * ---------------
       * Complexity O(S) where S is the number of slashing spans to remove
       * Base Weight:
       * Update: 50.52 + .028 * S µs
       * - Reads: EraElectionStatus, Ledger, Current Era, Locks, [Origin Account]
       * - Writes: [Origin Account], Locks, Ledger
       * Kill: 79.41 + 2.366 * S µs
       * - Reads: EraElectionStatus, Ledger, Current Era, Bonded, Slashing Spans, [Origin Account], Locks
       * - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, [Origin Account], Locks
       * - Writes Each: SpanSlash * S
       * NOTE: Weight annotation is the kill scenario, we refund otherwise.
       * # </weight>
       **/
      withdrawUnbonded: AugmentedSubmittable<(numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    storageWorkingGroup: {
      /**
       * Begin accepting worker applications to an opening that is active.
       * Require signed leader origin or the root (to accept applications for the leader position).
       **/
      acceptApplications: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Add an opening for a worker role.
       * Require signed leader origin or the root (to add opening for the leader position).
       **/
      addOpening: AugmentedSubmittable<(activateAt: ActivateOpeningAt | { CurrentBlock: any } | { ExactBlock: any } | string | Uint8Array, commitment: OpeningPolicyCommitment | { application_rationing_policy?: any; max_review_period_length?: any; application_staking_policy?: any; role_staking_policy?: any; role_slashing_terms?: any; fill_opening_successful_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_application_stake_unstaking_period?: any; fill_opening_failed_applicant_role_stake_unstaking_period?: any; terminate_application_stake_unstaking_period?: any; terminate_role_stake_unstaking_period?: any; exit_role_application_stake_unstaking_period?: any; exit_role_stake_unstaking_period?: any } | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader'|'Worker' | number | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Apply on a worker opening.
       **/
      applyOnOpening: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, openingId: OpeningId | AnyNumber | Uint8Array, roleAccountId: AccountId | string | Uint8Array, optRoleStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, optApplicationStakeBalance: Option<BalanceOf> | null | object | string | Uint8Array, humanReadableText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Begin reviewing, and therefore not accepting new applications.
       * Require signed leader origin or the root (to begin review applications for the leader position).
       **/
      beginApplicantReview: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Decreases the worker/lead stake and returns the remainder to the worker role_account_id.
       * Can be decreased to zero, no actions on zero stake.
       * Require signed leader origin or the root (to decrease the leader stake).
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Fill opening for worker/lead.
       * Require signed leader origin or the root (to fill opening for the leader position).
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: ApplicationIdSet, rewardPolicy: Option<RewardPolicy> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Increases the worker/lead stake, demands a worker origin. Transfers tokens from the worker
       * role_account_id to the stake. No limits on the stake.
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Leave the role by the active worker.
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Sets the capacity to enable working group budget. Requires root origin.
       **/
      setMintCapacity: AugmentedSubmittable<(newCapacity: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Slashes the worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Require signed leader origin or the root (to slash the leader stake).
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, balance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the worker application. Can be done by the lead only.
       **/
      terminateApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Terminate the active worker by the lead.
       * Require signed leader origin or the root (to terminate the leader role).
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationaleText: Bytes | string | Uint8Array, slashStake: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the reward amount associated with a set reward relationship for the active worker.
       * Require signed leader origin or the root (to update leader reward amount).
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newAmount: BalanceOfMint | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role account of the active worker/lead.
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Withdraw the worker application. Can be done by the worker itself only.
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    sudo: {
      /**
       * Authenticates the current sudo key and sets the given AccountId (`new`) as the new sudo key.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * # <weight>
       * - O(1).
       * - Limited storage reads.
       * - One DB change.
       * # </weight>
       **/
      setKey: AugmentedSubmittable<(updated: LookupSource | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Authenticates the sudo key and dispatches a function call with `Root` origin.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * # <weight>
       * - O(1).
       * - Limited storage reads.
       * - One DB write (event).
       * - Weight of derivative `call` execution + 10,000.
       * # </weight>
       **/
      sudo: AugmentedSubmittable<(call: Call | { callIndex?: any; args?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Authenticates the sudo key and dispatches a function call with `Signed` origin from
       * a given account.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * # <weight>
       * - O(1).
       * - Limited storage reads.
       * - One DB write (event).
       * - Weight of derivative `call` execution + 10,000.
       * # </weight>
       **/
      sudoAs: AugmentedSubmittable<(who: LookupSource | string | Uint8Array, call: Call | { callIndex?: any; args?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Authenticates the sudo key and dispatches a function call with `Root` origin.
       * This function does not check the weight of the call, and instead allows the
       * Sudo user to specify the weight of the call.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * # <weight>
       * - O(1).
       * - The weight of this call is defined by the caller.
       * # </weight>
       **/
      sudoUncheckedWeight: AugmentedSubmittable<(call: Call | { callIndex?: any; args?: any } | string | Uint8Array, weight: Weight | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    system: {
      /**
       * A dispatch that will fill the block weight up to the given ratio.
       **/
      fillBlock: AugmentedSubmittable<(ratio: Perbill | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Kill all storage items with a key that starts with the given prefix.
       * 
       * **NOTE:** We rely on the Root origin to provide us the number of subkeys under
       * the prefix we are removing to accurately calculate the weight of this function.
       * 
       * # <weight>
       * - `O(P)` where `P` amount of keys with prefix `prefix`
       * - `P` storage deletions.
       * - Base Weight: 0.834 * P µs
       * - Writes: Number of subkeys + 1
       * # </weight>
       **/
      killPrefix: AugmentedSubmittable<(prefix: Key | string | Uint8Array, subkeys: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Kill some items from storage.
       * 
       * # <weight>
       * - `O(IK)` where `I` length of `keys` and `K` length of one key
       * - `I` storage deletions.
       * - Base Weight: .378 * i µs
       * - Writes: Number of items
       * # </weight>
       **/
      killStorage: AugmentedSubmittable<(keys: Vec<Key> | (Key | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Make some on-chain remark.
       * 
       * # <weight>
       * - `O(1)`
       * - Base Weight: 0.665 µs, independent of remark length.
       * - No DB operations.
       * # </weight>
       **/
      remark: AugmentedSubmittable<(remark: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set the new changes trie configuration.
       * 
       * # <weight>
       * - `O(1)`
       * - 1 storage write or delete (codec `O(1)`).
       * - 1 call to `deposit_log`: Uses `append` API, so O(1)
       * - Base Weight: 7.218 µs
       * - DB Weight:
       * - Writes: Changes Trie, System Digest
       * # </weight>
       **/
      setChangesTrieConfig: AugmentedSubmittable<(changesTrieConfig: Option<ChangesTrieConfiguration> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set the new runtime code.
       * 
       * # <weight>
       * - `O(C + S)` where `C` length of `code` and `S` complexity of `can_set_code`
       * - 1 storage write (codec `O(C)`).
       * - 1 call to `can_set_code`: `O(S)` (calls `sp_io::misc::runtime_version` which is expensive).
       * - 1 event.
       * The weight of this function is dependent on the runtime, but generally this is very expensive.
       * We will treat this as a full block.
       * # </weight>
       **/
      setCode: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set the new runtime code without doing any checks of the given `code`.
       * 
       * # <weight>
       * - `O(C)` where `C` length of `code`
       * - 1 storage write (codec `O(C)`).
       * - 1 event.
       * The weight of this function is dependent on the runtime. We will treat this as a full block.
       * # </weight>
       **/
      setCodeWithoutChecks: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set the number of pages in the WebAssembly environment's heap.
       * 
       * # <weight>
       * - `O(1)`
       * - 1 storage write.
       * - Base Weight: 1.405 µs
       * - 1 write to HEAP_PAGES
       * # </weight>
       **/
      setHeapPages: AugmentedSubmittable<(pages: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Set some items of storage.
       * 
       * # <weight>
       * - `O(I)` where `I` length of `items`
       * - `I` storage writes (`O(1)`).
       * - Base Weight: 0.568 * i µs
       * - Writes: Number of items
       * # </weight>
       **/
      setStorage: AugmentedSubmittable<(items: Vec<KeyValue> | (KeyValue)[]) => SubmittableExtrinsic<ApiType>>;
      /**
       * Kill the sending account, assuming there are no references outstanding and the composite
       * data is equal to its default value.
       * 
       * # <weight>
       * - `O(1)`
       * - 1 storage read and deletion.
       * --------------------
       * Base Weight: 8.626 µs
       * No DB Read or Write operations because caller is already in overlay
       * # </weight>
       **/
      suicide: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>>;
    };
    timestamp: {
      /**
       * Set the current time.
       * 
       * This call should be invoked exactly once per block. It will panic at the finalization
       * phase, if this call hasn't been invoked by that time.
       * 
       * The timestamp should be greater than the previous one by the amount specified by
       * `MinimumPeriod`.
       * 
       * The dispatch origin for this call must be `Inherent`.
       * 
       * # <weight>
       * - `O(T)` where `T` complexity of `on_timestamp_set`
       * - 1 storage read and 1 storage mutation (codec `O(1)`). (because of `DidUpdate::take` in `on_finalize`)
       * - 1 event handler `on_timestamp_set` `O(T)`.
       * - Benchmark: 7.678 (min squares analysis)
       * - NOTE: This benchmark was done for a runtime with insignificant `on_timestamp_set` handlers.
       * New benchmarking is needed when adding new handlers.
       * # </weight>
       **/
      set: AugmentedSubmittable<(now: Compact<Moment> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>>;
    };
    utility: {
      /**
       * Send a call through an indexed pseudonym of the sender.
       * 
       * Filter from origin are passed along. The call will be dispatched with an origin which
       * use the same filter as the origin of this call.
       * 
       * NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
       * because you expect `proxy` to have been used prior in the call stack and you do not want
       * the call restrictions to apply to any sub-accounts), then use `as_sub` instead.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * # <weight>
       * - Base weight: 2.861 µs
       * - Plus the weight of the `call`
       * # </weight>
       **/
      asLimitedSub: AugmentedSubmittable<(index: u16 | AnyNumber | Uint8Array, call: Call | { callIndex?: any; args?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Send a call through an indexed pseudonym of the sender.
       * 
       * NOTE: If you need to ensure that any account-based filtering is honored (i.e. because
       * you expect `proxy` to have been used prior in the call stack and you want it to apply to
       * any sub-accounts), then use `as_limited_sub` instead.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * # <weight>
       * - Base weight: 2.861 µs
       * - Plus the weight of the `call`
       * # </weight>
       **/
      asSub: AugmentedSubmittable<(index: u16 | AnyNumber | Uint8Array, call: Call | { callIndex?: any; args?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>>;
      /**
       * Send a batch of dispatch calls.
       * 
       * May be called from any origin.
       * 
       * - `calls`: The calls to be dispatched from the same origin.
       * 
       * If origin is root then call are dispatch without checking origin filter. (This includes
       * bypassing `frame_system::Trait::BaseCallFilter`).
       * 
       * # <weight>
       * - Base weight: 14.39 + .987 * c µs
       * - Plus the sum of the weights of the `calls`.
       * - Plus one additional event. (repeat read/write)
       * # </weight>
       * 
       * This will return `Ok` in all circumstances. To determine the success of the batch, an
       * event is deposited. If a call failed and the batch was interrupted, then the
       * `BatchInterrupted` event is deposited, along with the number of successful calls made
       * and the error of the failed call. If all were successful, then the `BatchCompleted`
       * event is deposited.
       **/
      batch: AugmentedSubmittable<(calls: Vec<Call> | (Call | { callIndex?: any; args?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>>;
    };
  }

  export interface SubmittableExtrinsics<ApiType extends ApiTypes> extends AugmentedSubmittables<ApiType> {
    (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType>;
  }
}
