// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { BTreeMap, BTreeSet, Bytes, Compact, Option, Vec, bool, u16, u32, u64, u8 } from '@polkadot/types';
import type { AnyNumber } from '@polkadot/types/types';
import type { ActorId, ApplicationId, ApplyOnOpeningParameters, BalanceKind, BountyActor, BountyCreationParameters, BountyId, BuyMembershipParameters, CategoryId, ChannelCategoryCreationParameters, ChannelCategoryId, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelId, ChannelOwnershipTransferRequest, ChannelOwnershipTransferRequestId, ChannelUpdateParameters, ContentActor, ContentId, ContentParameters, CuratorGroupId, CuratorId, DataObjectStorageRelationshipId, DataObjectType, DataObjectTypeId, EntryId, ExtendedPostId, ForumUserId, FundingRequestParameters, GeneralProposalParameters, InviteMembershipParameters, MemberId, MemoText, ModeratorId, ObjectOwner, OpeningId, OpeningType, OracleJudgment, ParticipantId, PersonActor, PersonCreationParameters, PersonId, PersonUpdateParameters, PlaylistCreationParameters, PlaylistId, PlaylistUpdateParameters, PollInput, PostId, PostReactionId, PrivilegedActor, ProposalDetailsOf, ProposalId, ReplyId, ReplyToDelete, SeriesId, SeriesParameters, StakePolicy, StorageProviderId, ThreadId, ThreadMode, VideoCategoryCreationParameters, VideoCategoryId, VideoCategoryUpdateParameters, VideoCreationParameters, VideoId, VideoUpdateParameters, VoteKind, WorkerId, WorkingGroup } from './all';
import type { BabeEquivocationProof } from '@polkadot/types/interfaces/babe';
import type { Extrinsic, Signature } from '@polkadot/types/interfaces/extrinsics';
import type { GrandpaEquivocationProof, KeyOwnerProof } from '@polkadot/types/interfaces/grandpa';
import type { Heartbeat } from '@polkadot/types/interfaces/imOnline';
import type { AccountId, Balance, BalanceOf, BlockNumber, Call, ChangesTrieConfiguration, Hash, Header, KeyValue, LookupSource, Moment, Perbill, Percent, Weight } from '@polkadot/types/interfaces/runtime';
import type { Keys } from '@polkadot/types/interfaces/session';
import type { CompactAssignments, ElectionScore, ElectionSize, EraIndex, RewardDestination, ValidatorIndex, ValidatorPrefs } from '@polkadot/types/interfaces/staking';
import type { Key } from '@polkadot/types/interfaces/system';
import type { ApiTypes, SubmittableExtrinsic } from '@polkadot/api/types';

declare module '@polkadot/api/types/submittable' {
  export interface AugmentedSubmittables<ApiType> {
    authorship: {
      /**
       * Provide a set of uncles.
       **/
      setUncles: AugmentedSubmittable<(newUncles: Vec<Header> | (Header | { parentHash?: any; number?: any; stateRoot?: any; extrinsicsRoot?: any; digest?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Header>]>;
    };
    babe: {
      /**
       * Report authority equivocation/misbehavior. This method will verify
       * the equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence will
       * be reported.
       **/
      reportEquivocation: AugmentedSubmittable<(equivocationProof: BabeEquivocationProof | { offender?: any; slotNumber?: any; firstHeader?: any; secondHeader?: any } | string | Uint8Array, keyOwnerProof: KeyOwnerProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [BabeEquivocationProof, KeyOwnerProof]>;
      /**
       * Report authority equivocation/misbehavior. This method will verify
       * the equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence will
       * be reported.
       * This extrinsic must be called unsigned and it is expected that only
       * block authors will call it (validated in `ValidateUnsigned`), as such
       * if the block author is defined it will be defined as the equivocation
       * reporter.
       **/
      reportEquivocationUnsigned: AugmentedSubmittable<(equivocationProof: BabeEquivocationProof | { offender?: any; slotNumber?: any; firstHeader?: any; secondHeader?: any } | string | Uint8Array, keyOwnerProof: KeyOwnerProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [BabeEquivocationProof, KeyOwnerProof]>;
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
      forceTransfer: AugmentedSubmittable<(source: LookupSource | string | Uint8Array, dest: LookupSource | string | Uint8Array, value: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource, LookupSource, Compact<Balance>]>;
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
      setBalance: AugmentedSubmittable<(who: LookupSource | string | Uint8Array, newFree: Compact<Balance> | AnyNumber | Uint8Array, newReserved: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource, Compact<Balance>, Compact<Balance>]>;
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
      transfer: AugmentedSubmittable<(dest: LookupSource | string | Uint8Array, value: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource, Compact<Balance>]>;
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
      transferKeepAlive: AugmentedSubmittable<(dest: LookupSource | string | Uint8Array, value: Compact<Balance> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource, Compact<Balance>]>;
    };
    blog: {
      /**
       * Blog owner can create posts, related to a given blog, if related blog is unlocked
       * 
       * <weight>
       * 
       * ## Weight
       * `O (T + B)` where:
       * - `T` is the length of the title
       * - `B` is the length of the body
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createPost: AugmentedSubmittable<(title: Bytes | string | Uint8Array, body: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, Bytes]>;
      /**
       * Create either root post reply or direct reply to reply
       * (Only accessible, if related blog and post are unlocked)
       * <weight>
       * 
       * ## Weight
       * `O (T)` where:
       * - `T` is the length of the `text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createReply: AugmentedSubmittable<(participantId: ParticipantId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, replyId: Option<ReplyId> | null | object | string | Uint8Array, text: Bytes | string | Uint8Array, editable: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [ParticipantId, PostId, Option<ReplyId>, Bytes, bool]>;
      /**
       * Remove reply from storage
       * 
       * <weight>
       * 
       * ## Weight
       * `O (R)` where
       * - R is the number of replies to be deleted
       * - DB:
       * - O(R)
       * # </weight>
       **/
      deleteReplies: AugmentedSubmittable<(participantId: ParticipantId | AnyNumber | Uint8Array, replies: Vec<ReplyToDelete> | (ReplyToDelete | { post_id?: any; reply_id?: any; hide?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [ParticipantId, Vec<ReplyToDelete>]>;
      /**
       * Blog owner can edit post, related to a given blog (if unlocked)
       * with a new title and/or body
       * <weight>
       * 
       * ## Weight
       * `O (T + B)` where:
       * - `T` is the length of the `new_title`
       * - `B` is the length of the `new_body`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      editPost: AugmentedSubmittable<(postId: PostId | AnyNumber | Uint8Array, newTitle: Option<Bytes> | null | object | string | Uint8Array, newBody: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PostId, Option<Bytes>, Option<Bytes>]>;
      /**
       * Reply owner can edit reply with a new text
       * (Only accessible, if related blog and post are unlocked)
       * 
       * <weight>
       * 
       * ## Weight
       * `O (T)` where:
       * - `T` is the length of the `new_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      editReply: AugmentedSubmittable<(participantId: ParticipantId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, replyId: ReplyId | AnyNumber | Uint8Array, newText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ParticipantId, PostId, ReplyId, Bytes]>;
      /**
       * Blog owner can lock posts, related to a given blog,
       * making post immutable to any actions (replies creation, post editing, etc.)
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)` doesn't depends on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      lockPost: AugmentedSubmittable<(postId: PostId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PostId]>;
      /**
       * Blog owner can unlock posts, related to a given blog,
       * making post accesible to previously forbidden actions
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)` doesn't depends on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      unlockPost: AugmentedSubmittable<(postId: PostId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PostId]>;
    };
    bounty: {
      /**
       * Announce work entry for a successful bounty.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      announceWorkEntry: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array, stakingAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, BountyId, AccountId]>;
      /**
       * Cancels a bounty.
       * It returns a cherry to creator and removes bounty.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelBounty: AugmentedSubmittable<(creator: BountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BountyActor, BountyId]>;
      /**
       * Creates a bounty. Metadata stored in the transaction log but discarded after that.
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the _metadata length.
       * - `M` is closed contract member list length.
       * - DB:
       * - O(M) (O(1) on open contract)
       * # </weight>
       **/
      createBounty: AugmentedSubmittable<(params: BountyCreationParameters | { oracle?: any; contract_type?: any; creator?: any; cherry?: any; entrant_stake?: any; funding_type?: any; work_period?: any; judging_period?: any } | string | Uint8Array, metadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [BountyCreationParameters, Bytes]>;
      /**
       * Provides bounty funding.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      fundBounty: AugmentedSubmittable<(funder: BountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BountyActor, BountyId, BalanceOf]>;
      /**
       * Submits an oracle judgment for a bounty.
       * # <weight>
       * 
       * ## weight
       * `O (N)`
       * - `N` is the work_data length,
       * - db:
       * - `O(N)`
       * # </weight>
       **/
      submitOracleJudgment: AugmentedSubmittable<(oracle: BountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array, judgment: OracleJudgment | { Winner: any } | { Rejected: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [BountyActor, BountyId, OracleJudgment]>;
      /**
       * Submit work for a bounty.
       * # <weight>
       * 
       * ## weight
       * `O (N)`
       * - `N` is the work_data length,
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      submitWork: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array, entryId: EntryId | AnyNumber | Uint8Array, workData: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, BountyId, EntryId, Bytes]>;
      /**
       * Vetoes a bounty.
       * It returns a cherry to creator and removes bounty.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      vetoBounty: AugmentedSubmittable<(bountyId: BountyId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BountyId]>;
      /**
       * Withdraw bounty funding by a member or a council.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawFunding: AugmentedSubmittable<(funder: BountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BountyActor, BountyId]>;
      /**
       * Withdraw work entrant funds.
       * Both legitimate participants and winners get their stake unlocked. Winners also get a
       * bounty reward.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawWorkEntrantFunds: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array, entryId: EntryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, BountyId, EntryId]>;
      /**
       * Withdraw work entry for a bounty. Existing stake could be partially slashed.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawWorkEntry: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, bountyId: BountyId | AnyNumber | Uint8Array, entryId: EntryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, BountyId, EntryId]>;
    };
    constitution: {
      /**
       * Sets the current constitution hash. Requires root origin.
       * # <weight>
       * - Complexity: `O(C)` where C is the length of the constitution text.
       * - Db reads: 0
       * - Db writes: 1 (constant value)
       * # </weight>
       **/
      amendConstitution: AugmentedSubmittable<(constitutionText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
    };
    content: {
      acceptChannelTransfer: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, requestId: ChannelOwnershipTransferRequestId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelOwnershipTransferRequestId]>;
      /**
       * Add curator to curator group under given `curator_group_id`
       **/
      addCuratorToGroup: AugmentedSubmittable<(curatorGroupId: CuratorGroupId | AnyNumber | Uint8Array, curatorId: CuratorId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [CuratorGroupId, CuratorId]>;
      addPersonToVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array, person: PersonId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoId, PersonId]>;
      cancelChannelTransferRequest: AugmentedSubmittable<(requestId: ChannelOwnershipTransferRequestId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ChannelOwnershipTransferRequestId]>;
      createChannel: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, params: ChannelCreationParameters | { assets?: any; meta?: any; reward_account?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelCreationParameters]>;
      createChannelCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, params: ChannelCategoryCreationParameters | { meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelCategoryCreationParameters]>;
      /**
       * Add new curator group to runtime storage
       **/
      createCuratorGroup: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      createPerson: AugmentedSubmittable<(actor: PersonActor | { Member: any } | { Curator: any } | string | Uint8Array, params: PersonCreationParameters | { assets?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PersonActor, PersonCreationParameters]>;
      createPlaylist: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: PlaylistCreationParameters | { meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, PlaylistCreationParameters]>;
      createSeries: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: SeriesParameters | { assets?: any; seasons?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, SeriesParameters]>;
      createVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: VideoCreationParameters | { assets?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, VideoCreationParameters]>;
      createVideoCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, params: VideoCategoryCreationParameters | { meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoCategoryCreationParameters]>;
      deleteChannelCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: ChannelCategoryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelCategoryId]>;
      deletePerson: AugmentedSubmittable<(actor: PersonActor | { Member: any } | { Curator: any } | string | Uint8Array, person: PersonId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PersonActor, PersonId]>;
      deletePlaylist: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, playlist: PlaylistId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, PlaylistId]>;
      deleteSeries: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, series: SeriesId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, SeriesId]>;
      deleteVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoId]>;
      deleteVideoCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: VideoCategoryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoCategoryId]>;
      /**
       * Remove assets of a channel from storage
       **/
      removeChannelAssets: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, assets: Vec<ContentId> | (ContentId | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, Vec<ContentId>]>;
      /**
       * Remove curator from a given curator group
       **/
      removeCuratorFromGroup: AugmentedSubmittable<(curatorGroupId: CuratorGroupId | AnyNumber | Uint8Array, curatorId: CuratorId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [CuratorGroupId, CuratorId]>;
      removePersonFromVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoId]>;
      requestChannelTransfer: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, request: ChannelOwnershipTransferRequest | { channel_id?: any; new_owner?: any; payment?: any; new_reward_account?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelOwnershipTransferRequest]>;
      /**
       * Set `is_active` status for curator group under given `curator_group_id`
       **/
      setCuratorGroupStatus: AugmentedSubmittable<(curatorGroupId: CuratorGroupId | AnyNumber | Uint8Array, isActive: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [CuratorGroupId, bool]>;
      setFeaturedVideos: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, list: Vec<VideoId> | (VideoId | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [ContentActor, Vec<VideoId>]>;
      updateChannel: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: ChannelUpdateParameters | { assets?: any; new_meta?: any; reward_account?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, ChannelUpdateParameters]>;
      updateChannelCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: ChannelCategoryId | AnyNumber | Uint8Array, params: ChannelCategoryUpdateParameters | { new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelCategoryId, ChannelCategoryUpdateParameters]>;
      updateChannelCensorshipStatus: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, isCensored: bool | boolean | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, bool, Bytes]>;
      updatePerson: AugmentedSubmittable<(actor: PersonActor | { Member: any } | { Curator: any } | string | Uint8Array, person: PersonId | AnyNumber | Uint8Array, params: PersonUpdateParameters | { assets?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PersonActor, PersonId, PersonUpdateParameters]>;
      updatePlaylist: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, playlist: PlaylistId | AnyNumber | Uint8Array, params: PlaylistUpdateParameters | { new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, PlaylistId, PlaylistUpdateParameters]>;
      updateSeries: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: ChannelId | AnyNumber | Uint8Array, params: SeriesParameters | { assets?: any; seasons?: any; meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, ChannelId, SeriesParameters]>;
      updateVideo: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array, params: VideoUpdateParameters | { assets?: any; new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoId, VideoUpdateParameters]>;
      updateVideoCategory: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, categoryId: VideoCategoryId | AnyNumber | Uint8Array, params: VideoCategoryUpdateParameters | { new_meta?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoCategoryId, VideoCategoryUpdateParameters]>;
      updateVideoCensorshipStatus: AugmentedSubmittable<(actor: ContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: VideoId | AnyNumber | Uint8Array, isCensored: bool | boolean | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ContentActor, VideoId, bool, Bytes]>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: StakePolicy | { stake_amount?: any; leaving_unstaking_period?: any } | string | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, OpeningType, StakePolicy, Option<BalanceOf>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `p.description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: ApplyOnOpeningParameters | { member_id?: any; opening_id?: any; role_account_id?: any; reward_account_id?: any; description?: any; stake_parameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplyOnOpeningParameters]>;
      /**
       * Cancel an opening for the regular worker/lead position.
       * Require signed leader origin or the root (to cancel opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [OpeningId]>;
      /**
       * Decreases the regular worker/lead stake and returns the remainder to the
       * worker staking_account_id. Can be decreased to zero, no actions on zero stake.
       * Accepts the stake amount to decrease.
       * Requires signed leader origin or the root (to decrease the leader stake).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Fill opening for the regular/lead position.
       * Require signed leader origin or the root (to fill opening for the leader position).
       * # <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the length of `successful_application_ids`
       * - DB:
       * - O(A)
       * # </weight>
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<ApplicationId>) => SubmittableExtrinsic<ApiType>, [OpeningId, BTreeSet<ApplicationId>]>;
      /**
       * Increases the regular worker/lead stake, demands a worker origin.
       * Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<Bytes>]>;
      /**
       * Sets a new budget for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudget: AugmentedSubmittable<(newBudget: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the length of the contents of `status_text` when it is not none
       * 
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStatusText: AugmentedSubmittable<(statusText: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<Bytes>]>;
      /**
       * Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Requires signed leader origin or the root (to slash the leader stake).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penality.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf, Option<Bytes>]>;
      /**
       * Transfers specified amount to any account.
       * Requires leader origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId | string | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, BalanceOf, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penalty.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: Option<BalanceOf> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>, Option<Bytes>]>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the reward per block for the active worker.
       * Require signed leader origin or the root (to update leader's reward amount).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>]>;
      /**
       * Update the associated role account of the active regular worker/lead.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Bytes]>;
      /**
       * Withdraw the worker application. Can be done by the worker only.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplicationId]>;
    };
    council: {
      /**
       * Subscribe candidate
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      announceCandidacy: AugmentedSubmittable<(membershipId: MemberId | AnyNumber | Uint8Array, stakingAccountId: AccountId | string | Uint8Array, rewardAccountId: AccountId | string | Uint8Array, stake: Balance | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, AccountId, AccountId, Balance]>;
      /**
       * Transfers funds from council budget to account
       * 
       * # <weight>
       * 
       * ## weight
       * `O (F)` where:
       * `F` is the length of `funding_requests`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      fundingRequest: AugmentedSubmittable<(fundingRequests: Vec<FundingRequestParameters> | (FundingRequestParameters | { account?: any; amount?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<FundingRequestParameters>]>;
      /**
       * Plan the next budget refill.
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      planBudgetRefill: AugmentedSubmittable<(nextRefill: BlockNumber | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BlockNumber]>;
      /**
       * Release candidacy stake that is no longer needed.
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      releaseCandidacyStake: AugmentedSubmittable<(membershipId: MemberId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId]>;
      /**
       * Sets the budget balance.
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudget: AugmentedSubmittable<(balance: Balance | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Balance]>;
      /**
       * Sets the budget refill amount
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudgetIncrement: AugmentedSubmittable<(budgetIncrement: Balance | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Balance]>;
      /**
       * Set short description for the user's candidacy. Can be called anytime during user's candidacy.
       * 
       * # <weight>
       * 
       * ## weight
       * `O (N)` where:
       * `N` is the length of `note`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      setCandidacyNote: AugmentedSubmittable<(membershipId: MemberId | AnyNumber | Uint8Array, note: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, Bytes]>;
      /**
       * Sets the councilor reward per block
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      setCouncilorReward: AugmentedSubmittable<(councilorReward: Balance | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Balance]>;
      /**
       * Withdraw candidacy and release candidacy stake.
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawCandidacy: AugmentedSubmittable<(membershipId: MemberId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId]>;
    };
    dataDirectory: {
      /**
       * Storage provider accepts a content. Requires signed storage provider account and its id.
       * The LiaisonJudgement can only be updated once from Pending to Accepted.
       * Subsequent calls are a no-op.
       **/
      acceptContent: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, contentId: ContentId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [StorageProviderId, ContentId]>;
      /**
       * Adds the content to the frame_system. The created DataObject
       * awaits liaison to accept it.
       **/
      addContent: AugmentedSubmittable<(owner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, content: Vec<ContentParameters> | (ContentParameters | { content_id?: any; type_id?: any; ipfs_content_id?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [ObjectOwner, Vec<ContentParameters>]>;
      /**
       * Remove the content from the frame_system.
       **/
      removeContent: AugmentedSubmittable<(owner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, contentIds: Vec<ContentId> | (ContentId | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [ObjectOwner, Vec<ContentId>]>;
      /**
       * Set the default owner voucher
       **/
      setDefaultVoucher: AugmentedSubmittable<(sizeLimit: u64 | AnyNumber | Uint8Array, objectsLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Sets global voucher objects limit. Requires root privileges.
       * New limit cannot be less that used value.
       **/
      setGlobalVoucherObjectsLimit: AugmentedSubmittable<(newObjectsLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Sets global voucher size limit. Requires root privileges.
       * New limit cannot be less that used value.
       **/
      setGlobalVoucherSizeLimit: AugmentedSubmittable<(newSizeLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Sets VoucherObjectsLimitUpperBound. Requires root privileges.
       **/
      setVoucherObjectsLimitUpperBound: AugmentedSubmittable<(newUpperBound: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Sets VoucherSizeLimitUpperBound. Requires root privileges.
       **/
      setVoucherSizeLimitUpperBound: AugmentedSubmittable<(newUpperBound: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Locks / unlocks content uploading
       **/
      updateContentUploadingStatus: AugmentedSubmittable<(isBlocked: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [bool]>;
      /**
       * Updates storage object owner voucher objects limit. Requires leader privileges.
       * New limit cannot be less that used value.
       **/
      updateStorageObjectOwnerVoucherObjectsLimit: AugmentedSubmittable<(objectOwner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, newVoucherObjectsLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ObjectOwner, u64]>;
      /**
       * Updates storage object owner voucher size limit. Requires leader privileges.
       * New limit cannot be less that used value.
       **/
      updateStorageObjectOwnerVoucherSizeLimit: AugmentedSubmittable<(objectOwner: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array, newVoucherSizeLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ObjectOwner, u64]>;
    };
    dataObjectStorageRegistry: {
      /**
       * Add storage provider-to-content relationship. The storage provider should be registered
       * in the storage working group.
       **/
      addRelationship: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, cid: ContentId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [StorageProviderId, ContentId]>;
      /**
       * Activates storage provider-to-content relationship. The storage provider should be registered
       * in the storage working group. A storage provider may flip their own ready state, but nobody else.
       **/
      setRelationshipReady: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, id: DataObjectStorageRelationshipId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [StorageProviderId, DataObjectStorageRelationshipId]>;
      /**
       * Deactivates storage provider-to-content relationship. The storage provider should be registered
       * in the storage working group. A storage provider may flip their own ready state, but nobody else.
       **/
      unsetRelationshipReady: AugmentedSubmittable<(storageProviderId: StorageProviderId | AnyNumber | Uint8Array, id: DataObjectStorageRelationshipId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [StorageProviderId, DataObjectStorageRelationshipId]>;
    };
    dataObjectTypeRegistry: {
      /**
       * Activates existing data object type. Requires leader privileges.
       **/
      activateDataObjectType: AugmentedSubmittable<(id: DataObjectTypeId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [DataObjectTypeId]>;
      /**
       * Deactivates existing data object type. Requires leader privileges.
       **/
      deactivateDataObjectType: AugmentedSubmittable<(id: DataObjectTypeId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [DataObjectTypeId]>;
      /**
       * Registers the new data object type. Requires leader privileges.
       **/
      registerDataObjectType: AugmentedSubmittable<(dataObjectType: DataObjectType | { description?: any; active?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DataObjectType]>;
      /**
       * Updates existing data object type. Requires leader privileges.
       **/
      updateDataObjectType: AugmentedSubmittable<(id: DataObjectTypeId | AnyNumber | Uint8Array, dataObjectType: DataObjectType | { description?: any; active?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DataObjectTypeId, DataObjectType]>;
    };
    finalityTracker: {
      /**
       * Hint that the author of this block thinks the best finalized
       * block is the given number.
       **/
      finalHint: AugmentedSubmittable<(hint: Compact<BlockNumber> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<BlockNumber>]>;
    };
    forum: {
      /**
       * Add post
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth,
       * - `V` is the length of the text
       * - DB:
       * - O(W)
       * # </weight>
       **/
      addPost: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array, editable: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, CategoryId, ThreadId, Bytes, bool]>;
      /**
       * Add a new category.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X)` where:
       * - `W` is the category depth
       * - `V` is the length of the category title.
       * - `X` is the length of the category description.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      createCategory: AugmentedSubmittable<(parentCategoryId: Option<CategoryId> | null | object | string | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<CategoryId>, Bytes, Bytes]>;
      /**
       * Create new thread in category with poll
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X + Y)` where:
       * - `W` is the category depth
       * - `V` is the length of the thread title.
       * - `X` is the length of the thread text.
       * - `Y` is the number of poll alternatives.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      createThread: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, metadata: Bytes | string | Uint8Array, text: Bytes | string | Uint8Array, pollInput: Option<PollInput> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, CategoryId, Bytes, Bytes, Option<PollInput>]>;
      /**
       * Delete category
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the category depth
       * - DB:
       * - O(W)
       * # </weight>
       **/
      deleteCategory: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId]>;
      /**
       * Delete post from storage.
       * You need to provide a vector of posts to delete in the form
       * (T::CategoryId, T::ThreadId, T::PostId, bool)
       * where the last bool is whether you want to hide it apart from deleting it
       * 
       * ## Weight
       * `O (W + V + P)` where:
       * - `W` is the category depth,
       * - `V` is the length of the rationale
       * - `P` is the number of posts to delete
       * - DB:
       * - O(W + P)
       * # </weight>
       **/
      deletePosts: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, posts: BTreeMap<ExtendedPostId, bool>, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, BTreeMap<ExtendedPostId, bool>, Bytes]>;
      /**
       * Delete thread
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the category depth
       * - DB:
       * - O(W)
       * # </weight>
       **/
      deleteThread: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, hide: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, CategoryId, ThreadId, bool]>;
      /**
       * Edit post text
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth,
       * - `V` is the length of the new text
       * - DB:
       * - O(W)
       * # </weight>
       **/
      editPostText: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, newText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, CategoryId, ThreadId, PostId, Bytes]>;
      /**
       * Edit thread title
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth
       * - `V` is the length of the thread title.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      editThreadMetadata: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, newMetadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, CategoryId, ThreadId, Bytes]>;
      /**
       * Moderate post
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth,
       * - `V` is the length of the rationale
       * - DB:
       * - O(W)
       * # </weight>
       **/
      moderatePost: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId, ThreadId, PostId, Bytes]>;
      /**
       * Moderate thread
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X)` where:
       * - `W` is the category depth,
       * - `V` is the number of thread posts,
       * - `X` is the length of the rationale
       * - DB:
       * - O(W + V)
       * # </weight>
       **/
      moderateThread: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId, ThreadId, Bytes]>;
      /**
       * Move thread to another category
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the category depth
       * - DB:
       * - O(W)
       * # </weight>
       **/
      moveThreadToCategory: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, newCategoryId: CategoryId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId, ThreadId, CategoryId]>;
      /**
       * Like or unlike a post.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the category depth,
       * - DB:
       * - O(W)
       * # </weight>
       **/
      reactPost: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, react: PostReactionId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, CategoryId, ThreadId, PostId, PostReactionId]>;
      /**
       * Set stickied threads for category
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth,
       * - `V` is the length of the stickied_ids
       * - DB:
       * - O(W + V)
       * # </weight>
       **/
      setStickiedThreads: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, stickiedIds: Vec<ThreadId> | (ThreadId | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId, Vec<ThreadId>]>;
      /**
       * Update archival status
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the category depth
       * - DB:
       * - O(W)
       * # </weight>
       **/
      updateCategoryArchivalStatus: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, newArchivalStatus: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId, bool]>;
      /**
       * Update category description
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the category depth
       * - `V` is the length of the category description.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      updateCategoryDescription: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, description: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId, Bytes]>;
      /**
       * Enable a moderator can moderate a category and its sub categories.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateCategoryMembershipOfModerator: AugmentedSubmittable<(moderatorId: ModeratorId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, newValue: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [ModeratorId, CategoryId, bool]>;
      /**
       * Update category title
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth
       * - `V` is the length of the category title.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      updateCategoryTitle: AugmentedSubmittable<(actor: PrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PrivilegedActor, CategoryId, Bytes]>;
      /**
       * Submit a poll
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth,
       * - `V` is the number of poll alternatives.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      voteOnPoll: AugmentedSubmittable<(forumUserId: ForumUserId | AnyNumber | Uint8Array, categoryId: CategoryId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, index: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ForumUserId, CategoryId, ThreadId, u32]>;
    };
    forumWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: StakePolicy | { stake_amount?: any; leaving_unstaking_period?: any } | string | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, OpeningType, StakePolicy, Option<BalanceOf>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `p.description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: ApplyOnOpeningParameters | { member_id?: any; opening_id?: any; role_account_id?: any; reward_account_id?: any; description?: any; stake_parameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplyOnOpeningParameters]>;
      /**
       * Cancel an opening for the regular worker/lead position.
       * Require signed leader origin or the root (to cancel opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [OpeningId]>;
      /**
       * Decreases the regular worker/lead stake and returns the remainder to the
       * worker staking_account_id. Can be decreased to zero, no actions on zero stake.
       * Accepts the stake amount to decrease.
       * Requires signed leader origin or the root (to decrease the leader stake).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Fill opening for the regular/lead position.
       * Require signed leader origin or the root (to fill opening for the leader position).
       * # <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the length of `successful_application_ids`
       * - DB:
       * - O(A)
       * # </weight>
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<ApplicationId>) => SubmittableExtrinsic<ApiType>, [OpeningId, BTreeSet<ApplicationId>]>;
      /**
       * Increases the regular worker/lead stake, demands a worker origin.
       * Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<Bytes>]>;
      /**
       * Sets a new budget for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudget: AugmentedSubmittable<(newBudget: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the length of the contents of `status_text` when it is not none
       * 
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStatusText: AugmentedSubmittable<(statusText: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<Bytes>]>;
      /**
       * Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Requires signed leader origin or the root (to slash the leader stake).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penality.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf, Option<Bytes>]>;
      /**
       * Transfers specified amount to any account.
       * Requires leader origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId | string | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, BalanceOf, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penalty.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: Option<BalanceOf> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>, Option<Bytes>]>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the reward per block for the active worker.
       * Require signed leader origin or the root (to update leader's reward amount).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>]>;
      /**
       * Update the associated role account of the active regular worker/lead.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Bytes]>;
      /**
       * Withdraw the worker application. Can be done by the worker only.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplicationId]>;
    };
    gatewayWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: StakePolicy | { stake_amount?: any; leaving_unstaking_period?: any } | string | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, OpeningType, StakePolicy, Option<BalanceOf>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `p.description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: ApplyOnOpeningParameters | { member_id?: any; opening_id?: any; role_account_id?: any; reward_account_id?: any; description?: any; stake_parameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplyOnOpeningParameters]>;
      /**
       * Cancel an opening for the regular worker/lead position.
       * Require signed leader origin or the root (to cancel opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [OpeningId]>;
      /**
       * Decreases the regular worker/lead stake and returns the remainder to the
       * worker staking_account_id. Can be decreased to zero, no actions on zero stake.
       * Accepts the stake amount to decrease.
       * Requires signed leader origin or the root (to decrease the leader stake).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Fill opening for the regular/lead position.
       * Require signed leader origin or the root (to fill opening for the leader position).
       * # <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the length of `successful_application_ids`
       * - DB:
       * - O(A)
       * # </weight>
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<ApplicationId>) => SubmittableExtrinsic<ApiType>, [OpeningId, BTreeSet<ApplicationId>]>;
      /**
       * Increases the regular worker/lead stake, demands a worker origin.
       * Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<Bytes>]>;
      /**
       * Sets a new budget for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudget: AugmentedSubmittable<(newBudget: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the length of the contents of `status_text` when it is not none
       * 
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStatusText: AugmentedSubmittable<(statusText: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<Bytes>]>;
      /**
       * Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Requires signed leader origin or the root (to slash the leader stake).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penality.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf, Option<Bytes>]>;
      /**
       * Transfers specified amount to any account.
       * Requires leader origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId | string | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, BalanceOf, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penalty.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: Option<BalanceOf> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>, Option<Bytes>]>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the reward per block for the active worker.
       * Require signed leader origin or the root (to update leader's reward amount).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>]>;
      /**
       * Update the associated role account of the active regular worker/lead.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Bytes]>;
      /**
       * Withdraw the worker application. Can be done by the worker only.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplicationId]>;
    };
    grandpa: {
      /**
       * Note that the current authority set of the GRANDPA finality gadget has
       * stalled. This will trigger a forced authority set change at the beginning
       * of the next session, to be enacted `delay` blocks after that. The delay
       * should be high enough to safely assume that the block signalling the
       * forced change will not be re-orged (e.g. 1000 blocks). The GRANDPA voters
       * will start the new authority set using the given finalized block as base.
       * Only callable by root.
       **/
      noteStalled: AugmentedSubmittable<(delay: BlockNumber | AnyNumber | Uint8Array, bestFinalizedBlockNumber: BlockNumber | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BlockNumber, BlockNumber]>;
      /**
       * Report voter equivocation/misbehavior. This method will verify the
       * equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence
       * will be reported.
       **/
      reportEquivocation: AugmentedSubmittable<(equivocationProof: GrandpaEquivocationProof | { setId?: any; equivocation?: any } | string | Uint8Array, keyOwnerProof: KeyOwnerProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [GrandpaEquivocationProof, KeyOwnerProof]>;
      /**
       * Report voter equivocation/misbehavior. This method will verify the
       * equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence
       * will be reported.
       * 
       * This extrinsic must be called unsigned and it is expected that only
       * block authors will call it (validated in `ValidateUnsigned`), as such
       * if the block author is defined it will be defined as the equivocation
       * reporter.
       **/
      reportEquivocationUnsigned: AugmentedSubmittable<(equivocationProof: GrandpaEquivocationProof | { setId?: any; equivocation?: any } | string | Uint8Array, keyOwnerProof: KeyOwnerProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [GrandpaEquivocationProof, KeyOwnerProof]>;
    };
    imOnline: {
      /**
       * # <weight>
       * - Complexity: `O(K + E)` where K is length of `Keys` (heartbeat.validators_len)
       * and E is length of `heartbeat.network_state.external_address`
       * - `O(K)`: decoding of length `K`
       * - `O(E)`: decoding/encoding of length `E`
       * - DbReads: pallet_session `Validators`, pallet_session `CurrentIndex`, `Keys`,
       * `ReceivedHeartbeats`
       * - DbWrites: `ReceivedHeartbeats`
       * # </weight>
       **/
      heartbeat: AugmentedSubmittable<(heartbeat: Heartbeat | { blockNumber?: any; networkState?: any; sessionIndex?: any; authorityIndex?: any; validatorsLen?: any } | string | Uint8Array, signature: Signature | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Heartbeat, Signature]>;
    };
    joystreamUtility: {
      /**
       * Burns token for caller account
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      burnAccountTokens: AugmentedSubmittable<(amount: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Runtime upgrade proposal extrinsic.
       * Should be used as callable object to pass to the `engine` module.
       * <weight>
       * 
       * ## Weight
       * `O (C)` where:
       * - `C` is the length of `wasm`
       * However, we treat this as a full block as `frame_system::Module::set_code` does
       * # </weight>
       **/
      executeRuntimeUpgradeProposal: AugmentedSubmittable<(wasm: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Signal proposal extrinsic. Should be used as callable object to pass to the `engine` module.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the length of the signal
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      executeSignalProposal: AugmentedSubmittable<(signal: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Update working group budget
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateWorkingGroupBudget: AugmentedSubmittable<(workingGroup: WorkingGroup | 'Forum' | 'Storage' | 'Content' | 'Membership' | 'Operations' | 'Gateway' | number | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array, balanceKind: BalanceKind | 'Positive' | 'Negative' | number | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkingGroup, BalanceOf, BalanceKind]>;
    };
    members: {
      /**
       * Add staking account candidate for a member.
       * The membership must be confirmed before usage.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addStakingAccountCandidate: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId]>;
      /**
       * Non-members can buy membership.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X + Y)` where:
       * - `W` is the member name
       * - `V` is the member handle
       * - `X` is the member avatar uri
       * - `Y` is the member about
       * - DB:
       * - O(V)
       * # </weight>
       **/
      buyMembership: AugmentedSubmittable<(params: BuyMembershipParameters | { root_account?: any; controller_account?: any; handle?: any; metadata?: any; referrer_id?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [BuyMembershipParameters]>;
      /**
       * Confirm staking account candidate for a member.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      confirmStakingAccount: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, stakingAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, AccountId]>;
      /**
       * Invite a new member.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X + Y)` where:
       * - `W` is the member name
       * - `V` is the member handle
       * - `X` is the member avatar uri
       * - `Y` is the member about
       * - DB:
       * - O(V)
       * # </weight>
       **/
      inviteMember: AugmentedSubmittable<(params: InviteMembershipParameters | { inviting_member_id?: any; root_account?: any; controller_account?: any; handle?: any; metadata?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [InviteMembershipParameters]>;
      /**
       * Remove staking account for a member.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      removeStakingAccount: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId]>;
      /**
       * Updates initial invitation balance for a invited member. Requires root origin.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setInitialInvitationBalance: AugmentedSubmittable<(newInitialBalance: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Updates initial invitation count for a member. Requires root origin.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setInitialInvitationCount: AugmentedSubmittable<(newInvitationCount: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
      /**
       * Updates leader invitation quota. Requires root origin.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setLeaderInvitationQuota: AugmentedSubmittable<(invitationQuota: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
      /**
       * Updates membership price. Requires root origin.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setMembershipPrice: AugmentedSubmittable<(newPrice: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Updates membership referral cut percent value. Requires root origin.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setReferralCut: AugmentedSubmittable<(percentValue: u8 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u8]>;
      /**
       * Transfers invites from one member to another.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      transferInvites: AugmentedSubmittable<(sourceMemberId: MemberId | AnyNumber | Uint8Array, targetMemberId: MemberId | AnyNumber | Uint8Array, numberOfInvites: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, MemberId, u32]>;
      /**
       * Updates member root or controller accounts. No effect if both new accounts are empty.
       * 
       * <weight>
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateAccounts: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, newRootAccount: Option<AccountId> | null | object | string | Uint8Array, newControllerAccount: Option<AccountId> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, Option<AccountId>, Option<AccountId>]>;
      /**
       * Update member's all or some of name, handle, avatar and about text.
       * No effect if no changed fields.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the handle length
       * - DB:
       * - O(W)
       * # </weight>
       **/
      updateProfile: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, handle: Option<Bytes> | null | object | string | Uint8Array, metadata: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, Option<Bytes>, Option<Bytes>]>;
      /**
       * Updates member profile verification status. Requires working group member origin.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateProfileVerification: AugmentedSubmittable<(workerId: ActorId | AnyNumber | Uint8Array, targetMemberId: MemberId | AnyNumber | Uint8Array, isVerified: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [ActorId, MemberId, bool]>;
    };
    membershipWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: StakePolicy | { stake_amount?: any; leaving_unstaking_period?: any } | string | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, OpeningType, StakePolicy, Option<BalanceOf>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `p.description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: ApplyOnOpeningParameters | { member_id?: any; opening_id?: any; role_account_id?: any; reward_account_id?: any; description?: any; stake_parameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplyOnOpeningParameters]>;
      /**
       * Cancel an opening for the regular worker/lead position.
       * Require signed leader origin or the root (to cancel opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [OpeningId]>;
      /**
       * Decreases the regular worker/lead stake and returns the remainder to the
       * worker staking_account_id. Can be decreased to zero, no actions on zero stake.
       * Accepts the stake amount to decrease.
       * Requires signed leader origin or the root (to decrease the leader stake).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Fill opening for the regular/lead position.
       * Require signed leader origin or the root (to fill opening for the leader position).
       * # <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the length of `successful_application_ids`
       * - DB:
       * - O(A)
       * # </weight>
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<ApplicationId>) => SubmittableExtrinsic<ApiType>, [OpeningId, BTreeSet<ApplicationId>]>;
      /**
       * Increases the regular worker/lead stake, demands a worker origin.
       * Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<Bytes>]>;
      /**
       * Sets a new budget for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudget: AugmentedSubmittable<(newBudget: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the length of the contents of `status_text` when it is not none
       * 
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStatusText: AugmentedSubmittable<(statusText: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<Bytes>]>;
      /**
       * Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Requires signed leader origin or the root (to slash the leader stake).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penality.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf, Option<Bytes>]>;
      /**
       * Transfers specified amount to any account.
       * Requires leader origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId | string | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, BalanceOf, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penalty.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: Option<BalanceOf> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>, Option<Bytes>]>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the reward per block for the active worker.
       * Require signed leader origin or the root (to update leader's reward amount).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>]>;
      /**
       * Update the associated role account of the active regular worker/lead.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Bytes]>;
      /**
       * Withdraw the worker application. Can be done by the worker only.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplicationId]>;
    };
    memo: {
      updateMemo: AugmentedSubmittable<(memo: MemoText | string) => SubmittableExtrinsic<ApiType>, [MemoText]>;
    };
    operationsWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: StakePolicy | { stake_amount?: any; leaving_unstaking_period?: any } | string | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, OpeningType, StakePolicy, Option<BalanceOf>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `p.description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: ApplyOnOpeningParameters | { member_id?: any; opening_id?: any; role_account_id?: any; reward_account_id?: any; description?: any; stake_parameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplyOnOpeningParameters]>;
      /**
       * Cancel an opening for the regular worker/lead position.
       * Require signed leader origin or the root (to cancel opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [OpeningId]>;
      /**
       * Decreases the regular worker/lead stake and returns the remainder to the
       * worker staking_account_id. Can be decreased to zero, no actions on zero stake.
       * Accepts the stake amount to decrease.
       * Requires signed leader origin or the root (to decrease the leader stake).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Fill opening for the regular/lead position.
       * Require signed leader origin or the root (to fill opening for the leader position).
       * # <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the length of `successful_application_ids`
       * - DB:
       * - O(A)
       * # </weight>
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<ApplicationId>) => SubmittableExtrinsic<ApiType>, [OpeningId, BTreeSet<ApplicationId>]>;
      /**
       * Increases the regular worker/lead stake, demands a worker origin.
       * Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<Bytes>]>;
      /**
       * Sets a new budget for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudget: AugmentedSubmittable<(newBudget: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the length of the contents of `status_text` when it is not none
       * 
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStatusText: AugmentedSubmittable<(statusText: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<Bytes>]>;
      /**
       * Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Requires signed leader origin or the root (to slash the leader stake).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penality.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf, Option<Bytes>]>;
      /**
       * Transfers specified amount to any account.
       * Requires leader origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId | string | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, BalanceOf, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penalty.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: Option<BalanceOf> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>, Option<Bytes>]>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the reward per block for the active worker.
       * Require signed leader origin or the root (to update leader's reward amount).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>]>;
      /**
       * Update the associated role account of the active regular worker/lead.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Bytes]>;
      /**
       * Withdraw the worker application. Can be done by the worker only.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplicationId]>;
    };
    proposalsCodex: {
      /**
       * Create a proposal, the type of proposal depends on the `proposal_details` variant
       * 
       * <weight>
       * 
       * ## Weight
       * `O (T + D + I)` where:
       * - `T` is the length of the title
       * - `D` is the length of the description
       * - `I` is the length of any parameter in `proposal_details`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createProposal: AugmentedSubmittable<(generalProposalParameters: GeneralProposalParameters | { member_id?: any; title?: any; description?: any; staking_account_id?: any; exact_execution_block?: any } | string | Uint8Array, proposalDetails: ProposalDetailsOf | { Signal: any } | { RuntimeUpgrade: any } | { FundingRequest: any } | { SetMaxValidatorCount: any } | { CreateWorkingGroupLeadOpening: any } | { FillWorkingGroupLeadOpening: any } | { UpdateWorkingGroupBudget: any } | { DecreaseWorkingGroupLeadStake: any } | { SlashWorkingGroupLead: any } | { SetWorkingGroupLeadReward: any } | { TerminateWorkingGroupLead: any } | { AmendConstitution: any } | { CancelWorkingGroupLeadOpening: any } | { SetMembershipPrice: any } | { SetCouncilBudgetIncrement: any } | { SetCouncilorReward: any } | { SetInitialInvitationBalance: any } | { SetInitialInvitationCount: any } | { SetMembershipLeadInvitationQuota: any } | { SetReferralCut: any } | { CreateBlogPost: any } | { EditBlogPost: any } | { LockBlogPost: any } | { UnlockBlogPost: any } | { VetoProposal: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [GeneralProposalParameters, ProposalDetailsOf]>;
    };
    proposalsDiscussion: {
      /**
       * Adds a post with author origin check.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (L)` where:
       * - `L` is the length of `text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addPost: AugmentedSubmittable<(postAuthorId: MemberId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array, editable: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, ThreadId, Bytes, bool]>;
      /**
       * Changes thread permission mode.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` if ThreadMode is close or O(1) otherwise where:
       * - `W` is the number of whitelisted members in `mode`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      changeThreadMode: AugmentedSubmittable<(memberId: MemberId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, mode: ThreadMode | { Open: any } | { Closed: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, ThreadId, ThreadMode]>;
      /**
       * Remove post from storage, with the last parameter indicating whether to also hide it
       * in the UI.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      deletePost: AugmentedSubmittable<(deleterId: MemberId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, threadId: ThreadId | AnyNumber | Uint8Array, hide: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, PostId, ThreadId, bool]>;
      /**
       * Updates a post with author origin check. Update attempts number is limited.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (L)` where:
       * - `L` is the length of `text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updatePost: AugmentedSubmittable<(threadId: ThreadId | AnyNumber | Uint8Array, postId: PostId | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ThreadId, PostId, Bytes]>;
    };
    proposalsEngine: {
      /**
       * Cancel a proposal by its original proposer.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (L)` where:
       * - `L` is the total number of locks in `Balances`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelProposal: AugmentedSubmittable<(proposerId: MemberId | AnyNumber | Uint8Array, proposalId: ProposalId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, ProposalId]>;
      /**
       * Veto a proposal. Must be root.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)` doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      vetoProposal: AugmentedSubmittable<(proposalId: ProposalId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ProposalId]>;
      /**
       * Vote extrinsic. Conditions:  origin must allow votes.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the length of `rationale`
       * - DB:
       * - O(1) doesn't depend on the state or paraemters
       * # </weight>
       **/
      vote: AugmentedSubmittable<(voterId: MemberId | AnyNumber | Uint8Array, proposalId: ProposalId | AnyNumber | Uint8Array, vote: VoteKind | 'Approve' | 'Reject' | 'Slash' | 'Abstain' | number | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [MemberId, ProposalId, VoteKind, Bytes]>;
    };
    referendum: {
      /**
       * Release a locked stake.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      releaseVoteStake: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Reveal a sealed vote in the referendum.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the number of `intermediate_winners` stored in the current
       * `Stage::<T, I>::get()`
       * - DB:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      revealVote: AugmentedSubmittable<(salt: Bytes | string | Uint8Array, voteOptionId: MemberId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, MemberId]>;
      /**
       * Cast a sealed vote in the referendum.
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      vote: AugmentedSubmittable<(commitment: Hash | string | Uint8Array, stake: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Hash, BalanceOf]>;
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
      purgeKeys: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
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
      setKeys: AugmentedSubmittable<(keys: Keys | string | Uint8Array, proof: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Keys, Bytes]>;
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
       * Weight: O(1)
       * DB Weight:
       * - Read: Bonded, Ledger, [Origin Account], Current Era, History Depth, Locks
       * - Write: Bonded, Payee, [Origin Account], Locks, Ledger
       * # </weight>
       **/
      bond: AugmentedSubmittable<(controller: LookupSource | string | Uint8Array, value: Compact<BalanceOf> | AnyNumber | Uint8Array, payee: RewardDestination | { Staked: any } | { Stash: any } | { Controller: any } | { Account: any } | { None: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource, Compact<BalanceOf>, RewardDestination]>;
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
       * DB Weight:
       * - Read: Era Election Status, Bonded, Ledger, [Origin Account], Locks
       * - Write: [Origin Account], Locks, Ledger
       * # </weight>
       **/
      bondExtra: AugmentedSubmittable<(maxAdditional: Compact<BalanceOf> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<BalanceOf>]>;
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
       * - Read: Unapplied Slashes
       * - Write: Unapplied Slashes
       * # </weight>
       **/
      cancelDeferredSlash: AugmentedSubmittable<(era: EraIndex | AnyNumber | Uint8Array, slashIndices: Vec<u32> | (u32 | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [EraIndex, Vec<u32>]>;
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
       * Weight: O(1)
       * DB Weight:
       * - Read: EraElectionStatus, Ledger
       * - Write: Validators, Nominators
       * # </weight>
       **/
      chill: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Force there to be a new era at the end of the next session. After this, it will be
       * reset to normal (non-forced) behaviour.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - No arguments.
       * - Weight: O(1)
       * - Write ForceEra
       * # </weight>
       **/
      forceNewEra: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Force there to be a new era at the end of sessions indefinitely.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - Weight: O(1)
       * - Write: ForceEra
       * # </weight>
       **/
      forceNewEraAlways: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Force there to be no new eras indefinitely.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - No arguments.
       * - Weight: O(1)
       * - Write: ForceEra
       * # </weight>
       **/
      forceNoEras: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Force a current staker to become completely unstaked, immediately.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * O(S) where S is the number of slashing spans to be removed
       * Reads: Bonded, Slashing Spans, Account, Locks
       * Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Account, Locks
       * Writes Each: SpanSlash * S
       * # </weight>
       **/
      forceUnstake: AugmentedSubmittable<(stash: AccountId | string | Uint8Array, numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, u32]>;
      /**
       * Increments the ideal number of validators.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Same as [`set_validator_count`].
       * # </weight>
       **/
      increaseValidatorCount: AugmentedSubmittable<(additional: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u32>]>;
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
       * Weight: O(N)
       * where N is the number of targets
       * DB Weight:
       * - Reads: Era Election Status, Ledger, Current Era
       * - Writes: Validators, Nominators
       * # </weight>
       **/
      nominate: AugmentedSubmittable<(targets: Vec<LookupSource> | (LookupSource | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<LookupSource>]>;
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
       * Weight:
       * - Reward Destination Staked: O(N)
       * - Reward Destination Controller (Creating): O(N)
       * DB Weight:
       * - Read: EraElectionStatus, CurrentEra, HistoryDepth, ErasValidatorReward,
       * ErasStakersClipped, ErasRewardPoints, ErasValidatorPrefs (8 items)
       * - Read Each: Bonded, Ledger, Payee, Locks, System Account (5 items)
       * - Write Each: System Account, Locks, Ledger (3 items)
       * 
       * NOTE: weights are assuming that payouts are made to alive stash account (Staked).
       * Paying even a dead controller is cheaper weight-wise. We don't do any refunds here.
       * # </weight>
       **/
      payoutStakers: AugmentedSubmittable<(validatorStash: AccountId | string | Uint8Array, era: EraIndex | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, EraIndex]>;
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
       * DB Weight:
       * - Reads: Stash Account, Bonded, Slashing Spans, Locks
       * - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Stash Account, Locks
       * - Writes Each: SpanSlash * S
       * # </weight>
       **/
      reapStash: AugmentedSubmittable<(stash: AccountId | string | Uint8Array, numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, u32]>;
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
       * - DB Weight:
       * - Reads: EraElectionStatus, Ledger, Locks, [Origin Account]
       * - Writes: [Origin Account], Locks, Ledger
       * # </weight>
       **/
      rebond: AugmentedSubmittable<(value: Compact<BalanceOf> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<BalanceOf>]>;
      /**
       * Scale up the ideal number of validators by a factor.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Same as [`set_validator_count`].
       * # </weight>
       **/
      scaleValidatorCount: AugmentedSubmittable<(factor: Percent | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Percent]>;
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
       * Weight: O(1)
       * DB Weight:
       * - Read: Bonded, Ledger New Controller, Ledger Old Controller
       * - Write: Bonded, Ledger New Controller, Ledger Old Controller
       * # </weight>
       **/
      setController: AugmentedSubmittable<(controller: LookupSource | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource]>;
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
       * - Weight: O(E)
       * - DB Weight:
       * - Reads: Current Era, History Depth
       * - Writes: History Depth
       * - Clear Prefix Each: Era Stakers, EraStakersClipped, ErasValidatorPrefs
       * - Writes Each: ErasValidatorReward, ErasRewardPoints, ErasTotalStake, ErasStartSessionIndex
       * # </weight>
       **/
      setHistoryDepth: AugmentedSubmittable<(newHistoryDepth: Compact<EraIndex> | AnyNumber | Uint8Array, eraItemsDeleted: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<EraIndex>, Compact<u32>]>;
      /**
       * Set the validators who cannot be slashed (if any).
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * - O(V)
       * - Write: Invulnerables
       * # </weight>
       **/
      setInvulnerables: AugmentedSubmittable<(invulnerables: Vec<AccountId> | (AccountId | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId>]>;
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
       * - Weight: O(1)
       * - DB Weight:
       * - Read: Ledger
       * - Write: Payee
       * # </weight>
       **/
      setPayee: AugmentedSubmittable<(payee: RewardDestination | { Staked: any } | { Stash: any } | { Controller: any } | { Account: any } | { None: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [RewardDestination]>;
      /**
       * Sets the ideal number of validators.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Weight: O(1)
       * Write: Validator Count
       * # </weight>
       **/
      setValidatorCount: AugmentedSubmittable<(updated: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u32>]>;
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
       * The transaction is assumed to be the longest path, a better solution.
       * - Initial solution is almost the same.
       * - Worse solution is retraced in pre-dispatch-checks which sets its own weight.
       * # </weight>
       **/
      submitElectionSolution: AugmentedSubmittable<(winners: Vec<ValidatorIndex> | (ValidatorIndex | AnyNumber | Uint8Array)[], compact: CompactAssignments | { votes1?: any; votes2?: any; votes3?: any; votes4?: any; votes5?: any; votes6?: any; votes7?: any; votes8?: any; votes9?: any; votes10?: any; votes11?: any; votes12?: any; votes13?: any; votes14?: any; votes15?: any; votes16?: any } | string | Uint8Array, score: ElectionScore, era: EraIndex | AnyNumber | Uint8Array, size: ElectionSize | { validators?: any; nominators?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Vec<ValidatorIndex>, CompactAssignments, ElectionScore, EraIndex, ElectionSize]>;
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
      submitElectionSolutionUnsigned: AugmentedSubmittable<(winners: Vec<ValidatorIndex> | (ValidatorIndex | AnyNumber | Uint8Array)[], compact: CompactAssignments | { votes1?: any; votes2?: any; votes3?: any; votes4?: any; votes5?: any; votes6?: any; votes7?: any; votes8?: any; votes9?: any; votes10?: any; votes11?: any; votes12?: any; votes13?: any; votes14?: any; votes15?: any; votes16?: any } | string | Uint8Array, score: ElectionScore, era: EraIndex | AnyNumber | Uint8Array, size: ElectionSize | { validators?: any; nominators?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Vec<ValidatorIndex>, CompactAssignments, ElectionScore, EraIndex, ElectionSize]>;
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
       * Weight: O(1)
       * DB Weight:
       * - Read: EraElectionStatus, Ledger, CurrentEra, Locks, BalanceOf Stash,
       * - Write: Locks, Ledger, BalanceOf Stash,
       * </weight>
       **/
      unbond: AugmentedSubmittable<(value: Compact<BalanceOf> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<BalanceOf>]>;
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
       * Weight: O(1)
       * DB Weight:
       * - Read: Era Election Status, Ledger
       * - Write: Nominators, Validators
       * # </weight>
       **/
      validate: AugmentedSubmittable<(prefs: ValidatorPrefs | { commission?: any; blocked?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ValidatorPrefs]>;
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
       * Update:
       * - Reads: EraElectionStatus, Ledger, Current Era, Locks, [Origin Account]
       * - Writes: [Origin Account], Locks, Ledger
       * Kill:
       * - Reads: EraElectionStatus, Ledger, Current Era, Bonded, Slashing Spans, [Origin
       * Account], Locks, BalanceOf stash
       * - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators,
       * [Origin Account], Locks, BalanceOf stash.
       * - Writes Each: SpanSlash * S
       * NOTE: Weight annotation is the kill scenario, we refund otherwise.
       * # </weight>
       **/
      withdrawUnbonded: AugmentedSubmittable<(numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
    };
    storageWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: OpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: StakePolicy | { stake_amount?: any; leaving_unstaking_period?: any } | string | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, OpeningType, StakePolicy, Option<BalanceOf>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the length of `p.description`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: ApplyOnOpeningParameters | { member_id?: any; opening_id?: any; role_account_id?: any; reward_account_id?: any; description?: any; stake_parameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplyOnOpeningParameters]>;
      /**
       * Cancel an opening for the regular worker/lead position.
       * Require signed leader origin or the root (to cancel opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [OpeningId]>;
      /**
       * Decreases the regular worker/lead stake and returns the remainder to the
       * worker staking_account_id. Can be decreased to zero, no actions on zero stake.
       * Accepts the stake amount to decrease.
       * Requires signed leader origin or the root (to decrease the leader stake).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      decreaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Fill opening for the regular/lead position.
       * Require signed leader origin or the root (to fill opening for the leader position).
       * # <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the length of `successful_application_ids`
       * - DB:
       * - O(A)
       * # </weight>
       **/
      fillOpening: AugmentedSubmittable<(openingId: OpeningId | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<ApplicationId>) => SubmittableExtrinsic<ApiType>, [OpeningId, BTreeSet<ApplicationId>]>;
      /**
       * Increases the regular worker/lead stake, demands a worker origin.
       * Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      increaseStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, stakeBalanceDelta: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<Bytes>]>;
      /**
       * Sets a new budget for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setBudget: AugmentedSubmittable<(newBudget: BalanceOf | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [BalanceOf]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the length of the contents of `status_text` when it is not none
       * 
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStatusText: AugmentedSubmittable<(statusText: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<Bytes>]>;
      /**
       * Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
       * If slashing balance greater than the existing stake - stake is slashed to zero.
       * Requires signed leader origin or the root (to slash the leader stake).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penality.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, BalanceOf, Option<Bytes>]>;
      /**
       * Transfers specified amount to any account.
       * Requires leader origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId | string | Uint8Array, amount: BalanceOf | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId, BalanceOf, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the length of `penalty.slashing_text`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, penalty: Option<BalanceOf> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>, Option<Bytes>]>;
      /**
       * Update the reward account associated with a set reward relationship for the active worker.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRewardAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the reward per block for the active worker.
       * Require signed leader origin or the root (to update leader's reward amount).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRewardAmount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, rewardPerBlock: Option<BalanceOf> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Option<BalanceOf>]>;
      /**
       * Update the associated role account of the active regular worker/lead.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateRoleAccount: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, newRoleAccountId: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, AccountId]>;
      /**
       * Update the associated role storage.
       **/
      updateRoleStorage: AugmentedSubmittable<(workerId: WorkerId | AnyNumber | Uint8Array, storage: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WorkerId, Bytes]>;
      /**
       * Withdraw the worker application. Can be done by the worker only.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawApplication: AugmentedSubmittable<(applicationId: ApplicationId | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [ApplicationId]>;
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
      setKey: AugmentedSubmittable<(updated: LookupSource | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource]>;
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
      sudo: AugmentedSubmittable<(call: Call | { callIndex?: any; args?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Call]>;
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
      sudoAs: AugmentedSubmittable<(who: LookupSource | string | Uint8Array, call: Call | { callIndex?: any; args?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [LookupSource, Call]>;
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
      sudoUncheckedWeight: AugmentedSubmittable<(call: Call | { callIndex?: any; args?: any } | string | Uint8Array, weight: Weight | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Call, Weight]>;
    };
    system: {
      /**
       * A dispatch that will fill the block weight up to the given ratio.
       **/
      fillBlock: AugmentedSubmittable<(ratio: Perbill | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Perbill]>;
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
      killPrefix: AugmentedSubmittable<(prefix: Key | string | Uint8Array, subkeys: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Key, u32]>;
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
      killStorage: AugmentedSubmittable<(keys: Vec<Key> | (Key | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Key>]>;
      /**
       * Make some on-chain remark.
       * 
       * # <weight>
       * - `O(1)`
       * - Base Weight: 0.665 µs, independent of remark length.
       * - No DB operations.
       * # </weight>
       **/
      remark: AugmentedSubmittable<(remark: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
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
      setChangesTrieConfig: AugmentedSubmittable<(changesTrieConfig: Option<ChangesTrieConfiguration> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<ChangesTrieConfiguration>]>;
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
      setCode: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
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
      setCodeWithoutChecks: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
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
      setHeapPages: AugmentedSubmittable<(pages: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      setStorage: AugmentedSubmittable<(items: Vec<KeyValue> | (KeyValue)[]) => SubmittableExtrinsic<ApiType>, [Vec<KeyValue>]>;
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
      suicide: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
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
       * # </weight>
       **/
      set: AugmentedSubmittable<(now: Compact<Moment> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<Moment>]>;
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
       * the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
       * in the Multisig pallet instead.
       * 
       * NOTE: Prior to version *12, this was called `as_limited_sub`.
       * 
       * The dispatch origin for this call must be _Signed_.
       **/
      asDerivative: AugmentedSubmittable<(index: u16 | AnyNumber | Uint8Array, call: Call | { callIndex?: any; args?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Call]>;
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
      batch: AugmentedSubmittable<(calls: Vec<Call> | (Call | { callIndex?: any; args?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Call>]>;
    };
  }

  export interface SubmittableExtrinsics<ApiType extends ApiTypes> extends AugmentedSubmittables<ApiType> {
    (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType>;
  }
}
