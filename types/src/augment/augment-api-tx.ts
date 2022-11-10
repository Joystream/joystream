// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';
import type { BTreeMap, BTreeSet, Bytes, Compact, Option, U8aFixed, Vec, WrapperKeepOpaque, bool, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { AnyNumber, IMethod, ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, Call, H256, Perbill, Percent, Permill } from '@polkadot/types/interfaces/runtime';
import type { JoystreamNodeRuntimeOriginCaller, JoystreamNodeRuntimeSessionKeys, PalletBountyBountyActor, PalletBountyBountyParametersBTreeSet, PalletBountyOracleWorkEntryJudgment, PalletCommonBalanceKind, PalletCommonFundingRequestParameters, PalletCommonMerkleTreeProofElementRecord, PalletCommonWorkingGroupIterableEnumsWorkingGroup, PalletContentChannelBagWitness, PalletContentChannelCreationParametersRecord, PalletContentChannelOwner, PalletContentChannelUpdateParametersRecord, PalletContentInitTransferParameters, PalletContentIterableEnumsChannelActionPermission, PalletContentNftLimitPeriod, PalletContentNftTypesEnglishAuctionParamsRecord, PalletContentNftTypesNftIssuanceParametersRecord, PalletContentNftTypesOpenAuctionParamsRecord, PalletContentPermissionsContentActor, PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction, PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature, PalletContentPullPaymentElement, PalletContentTransferCommitmentParametersBTreeMap, PalletContentUpdateChannelPayoutsParametersRecord, PalletContentVideoCreationParametersRecord, PalletContentVideoUpdateParametersRecord, PalletElectionProviderMultiPhaseRawSolution, PalletElectionProviderMultiPhaseSolutionOrSnapshotSize, PalletForumExtendedPostIdObject, PalletForumPrivilegedActor, PalletImOnlineHeartbeat, PalletImOnlineSr25519AppSr25519Signature, PalletMembershipBuyMembershipParameters, PalletMembershipCreateMemberParameters, PalletMembershipGiftMembershipParameters, PalletMembershipInviteMembershipParameters, PalletMultisigTimepoint, PalletProjectTokenMerkleProof, PalletProjectTokenTokenIssuanceParameters, PalletProjectTokenTokenSaleParams, PalletProjectTokenTransfersPayment, PalletProjectTokenTransfersPaymentWithVesting, PalletProposalsCodexGeneralProposalParams, PalletProposalsCodexProposalDetails, PalletProposalsDiscussionThreadModeBTreeSet, PalletProposalsEngineVoteKind, PalletStakingPalletConfigOpPerbill, PalletStakingPalletConfigOpPercent, PalletStakingPalletConfigOpU128, PalletStakingPalletConfigOpU32, PalletStakingRewardDestination, PalletStakingValidatorPrefs, PalletStorageBagIdType, PalletStorageDistributionBucketIdRecord, PalletStorageDynamicBagType, PalletStorageUploadParametersRecord, PalletVestingVestingInfo, PalletWorkingGroupApplyOnOpeningParams, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, SpConsensusBabeDigestsNextConfigDescriptor, SpConsensusSlotsEquivocationProof, SpFinalityGrandpaEquivocationProof, SpNposElectionsElectionScore, SpNposElectionsSupport, SpRuntimeHeader, SpSessionMembershipProof } from '@polkadot/types/lookup';

declare module '@polkadot/api-base/types/submittable' {
  export interface AugmentedSubmittables<ApiType extends ApiTypes> {
    authorship: {
      /**
       * Provide a set of uncles.
       **/
      setUncles: AugmentedSubmittable<(newUncles: Vec<SpRuntimeHeader> | (SpRuntimeHeader | { parentHash?: any; number?: any; stateRoot?: any; extrinsicsRoot?: any; digest?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<SpRuntimeHeader>]>;
    };
    babe: {
      /**
       * Plan an epoch config change. The epoch config change is recorded and will be enacted on
       * the next call to `enact_epoch_change`. The config will be activated one epoch after.
       * Multiple calls to this method will replace any existing planned config change that had
       * not been enacted yet.
       **/
      planConfigChange: AugmentedSubmittable<(config: SpConsensusBabeDigestsNextConfigDescriptor | { V1: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [SpConsensusBabeDigestsNextConfigDescriptor]>;
      /**
       * Report authority equivocation/misbehavior. This method will verify
       * the equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence will
       * be reported.
       **/
      reportEquivocation: AugmentedSubmittable<(equivocationProof: SpConsensusSlotsEquivocationProof | { offender?: any; slot?: any; firstHeader?: any; secondHeader?: any } | string | Uint8Array, keyOwnerProof: SpSessionMembershipProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [SpConsensusSlotsEquivocationProof, SpSessionMembershipProof]>;
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
      reportEquivocationUnsigned: AugmentedSubmittable<(equivocationProof: SpConsensusSlotsEquivocationProof | { offender?: any; slot?: any; firstHeader?: any; secondHeader?: any } | string | Uint8Array, keyOwnerProof: SpSessionMembershipProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [SpConsensusSlotsEquivocationProof, SpSessionMembershipProof]>;
    };
    bagsList: {
      /**
       * Move the caller's Id directly in front of `lighter`.
       * 
       * The dispatch origin for this call must be _Signed_ and can only be called by the Id of
       * the account going in front of `lighter`.
       * 
       * Only works if
       * - both nodes are within the same bag,
       * - and `origin` has a greater `Score` than `lighter`.
       **/
      putInFrontOf: AugmentedSubmittable<(lighter: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      /**
       * Declare that some `dislocated` account has, through rewards or penalties, sufficiently
       * changed its score that it should properly fall into a different bag than its current
       * one.
       * 
       * Anyone can call this function about any potentially dislocated account.
       * 
       * Will always update the stored score of `dislocated` to the correct score, based on
       * `ScoreProvider`.
       * 
       * If `dislocated` does not exists, it returns an error.
       **/
      rebag: AugmentedSubmittable<(dislocated: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
    };
    balances: {
      /**
       * Exactly as `transfer`, except the origin must be root and the source account may be
       * specified.
       * # <weight>
       * - Same as transfer, but additional read and write because the source account is not
       * assumed to be in the overlay.
       * # </weight>
       **/
      forceTransfer: AugmentedSubmittable<(source: AccountId32 | string | Uint8Array, dest: AccountId32 | string | Uint8Array, value: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, AccountId32, Compact<u128>]>;
      /**
       * Unreserve some balance from a user by force.
       * 
       * Can only be called by ROOT.
       **/
      forceUnreserve: AugmentedSubmittable<(who: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128]>;
      /**
       * Set the balances of a given account.
       * 
       * This will alter `FreeBalance` and `ReservedBalance` in storage. it will
       * also alter the total issuance of the system (`TotalIssuance`) appropriately.
       * If the new free or reserved balance is below the existential deposit,
       * it will reset the account nonce (`frame_system::AccountNonce`).
       * 
       * The dispatch origin for this call is `root`.
       **/
      setBalance: AugmentedSubmittable<(who: AccountId32 | string | Uint8Array, newFree: Compact<u128> | AnyNumber | Uint8Array, newReserved: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, Compact<u128>, Compact<u128>]>;
      /**
       * Transfer some liquid free balance to another account.
       * 
       * `transfer` will set the `FreeBalance` of the sender and receiver.
       * If the sender's account is below the existential deposit as a result
       * of the transfer, the account will be reaped.
       * 
       * The dispatch origin for this call must be `Signed` by the transactor.
       * 
       * # <weight>
       * - Dependent on arguments but not critical, given proper implementations for input config
       * types. See related functions below.
       * - It contains a limited number of reads and writes internally and no complex
       * computation.
       * 
       * Related functions:
       * 
       * - `ensure_can_withdraw` is always called internally but has a bounded complexity.
       * - Transferring balances to accounts that did not exist before will cause
       * `T::OnNewAccount::on_new_account` to be called.
       * - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
       * - `transfer_keep_alive` works the same way as `transfer`, but has an additional check
       * that the transfer will not kill the origin account.
       * ---------------------------------
       * - Origin account is already in memory, so no DB operations for them.
       * # </weight>
       **/
      transfer: AugmentedSubmittable<(dest: AccountId32 | string | Uint8Array, value: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, Compact<u128>]>;
      /**
       * Transfer the entire transferable balance from the caller account.
       * 
       * NOTE: This function only attempts to transfer _transferable_ balances. This means that
       * any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
       * transferred by this function. To ensure that this function results in a killed account,
       * you might need to prepare the account by removing any reference counters, storage
       * deposits, etc...
       * 
       * The dispatch origin of this call must be Signed.
       * 
       * - `dest`: The recipient of the transfer.
       * - `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
       * of the funds the account has, causing the sender account to be killed (false), or
       * transfer everything except at least the existential deposit, which will guarantee to
       * keep the sender account alive (true). # <weight>
       * - O(1). Just like transfer, but reading the user's transferable balance first.
       * #</weight>
       **/
      transferAll: AugmentedSubmittable<(dest: AccountId32 | string | Uint8Array, keepAlive: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, bool]>;
      /**
       * Same as the [`transfer`] call, but with a check that the transfer will not kill the
       * origin account.
       * 
       * 99% of the time you want [`transfer`] instead.
       * 
       * [`transfer`]: struct.Pallet.html#method.transfer
       **/
      transferKeepAlive: AugmentedSubmittable<(dest: AccountId32 | string | Uint8Array, value: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, Compact<u128>]>;
    };
    bounty: {
      /**
       * Announce work entry for a successful bounty.
       * # <weight>
       * 
       * ## weight
       * `O (W + M)` where:
       * - `W` is the work_description size in kilobytes.
       * - `M` is closed contract member list length.
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      announceWorkEntry: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, stakingAccountId: AccountId32 | string | Uint8Array, workDescription: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, AccountId32, Bytes]>;
      /**
       * Bounty Contributor made a remark
       * 
       * # <weight>
       * 
       * ## weight
       * `O (N)`
       * - `N` is msg size in kilobytes
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      contributorRemark: AugmentedSubmittable<(contributor: PalletBountyBountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBountyBountyActor, u64, Bytes]>;
      /**
       * Creates a bounty. Metadata stored in the transaction log but discarded after that.
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the _metadata size in kilobytes.
       * - `M` is closed contract member list length.
       * - DB:
       * - O(M) (O(1) on open contract)
       * # </weight>
       **/
      createBounty: AugmentedSubmittable<(params: PalletBountyBountyParametersBTreeSet | { oracle?: any; contractType?: any; creator?: any; cherry?: any; oracleReward?: any; entrantStake?: any; fundingType?: any } | string | Uint8Array, metadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBountyBountyParametersBTreeSet, Bytes]>;
      /**
       * Bounty Oracle made a remark
       * 
       * # <weight>
       * 
       * ## weight
       * `O (N)`
       * - `N` is msg size in kilobytes
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      creatorRemark: AugmentedSubmittable<(creator: PalletBountyBountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBountyBountyActor, u64, Bytes]>;
      /**
       * end bounty working period.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      endWorkingPeriod: AugmentedSubmittable<(bountyId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Bounty Entrant Worker made a remark
       * 
       * # <weight>
       * 
       * ## weight
       * `O (N)`
       * - `N` is msg size in kilobytes
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      entrantRemark: AugmentedSubmittable<(entrantId: u64 | AnyNumber | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, entryId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64, Bytes]>;
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
      fundBounty: AugmentedSubmittable<(funder: PalletBountyBountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBountyBountyActor, u64, u128]>;
      /**
       * Bounty Oracle made a remark
       * 
       * # <weight>
       * 
       * ## weight
       * `O (N)`
       * - `N` is msg size in kilobytes
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      oracleRemark: AugmentedSubmittable<(oracle: PalletBountyBountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBountyBountyActor, u64, Bytes]>;
      /**
       * Submits an oracle judgment for a bounty, slashing the entries rejected
       * by an arbitrary percentage and rewarding the winners by an arbitrary amount
       * (not surpassing the total fund amount)
       * # <weight>
       * 
       * ## weight
       * `O (J + K + W + R)`
       * - `J` is rationale size in kilobytes,
       * - `K` is the sum of all action_justification sizes (in kilobytes) inside OracleJudgment,
       * - `W` is number of winner judgment entries,
       * - `R` is number of rejected judgment entries,
       * - db:
       * - `O(W + R)`
       * # </weight>
       **/
      submitOracleJudgment: AugmentedSubmittable<(bountyId: u64 | AnyNumber | Uint8Array, judgment: BTreeMap<u64, PalletBountyOracleWorkEntryJudgment>, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, BTreeMap<u64, PalletBountyOracleWorkEntryJudgment>, Bytes]>;
      /**
       * Submit work for a bounty.
       * # <weight>
       * 
       * ## weight
       * `O (N)`
       * - `N` is the work_data size in kilobytes,
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      submitWork: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, entryId: u64 | AnyNumber | Uint8Array, workData: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64, Bytes]>;
      /**
       * Oracle switches himself to a new one
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       * 
       **/
      switchOracle: AugmentedSubmittable<(newOracle: PalletBountyBountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBountyBountyActor, u64]>;
      /**
       * Terminates a bounty in funding, funding expired,
       * worksubmission, judging period.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateBounty: AugmentedSubmittable<(bountyId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Unlocks the stake related to a work entry
       * After the oracle makes the judgment or the council terminates the bounty by calling terminate_bounty(...),
       * each worker whose entry has not been judged, can unlock the totality of their stake.
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawEntrantStake: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array, entryId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64]>;
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
      withdrawFunding: AugmentedSubmittable<(funder: PalletBountyBountyActor | { Council: any } | { Member: any } | string | Uint8Array, bountyId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletBountyBountyActor, u64]>;
      /**
       * Withraws the oracle reward to oracle
       * If bounty is successfully, Failed or Cancelled oracle must call this
       * extrinsic to withdraw the oracle reward,
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      withdrawOracleReward: AugmentedSubmittable<(bountyId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      /**
       * Accepts channel transfer.
       * `commitment_params` is required to prevent changing the transfer conditions.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the number of entries in `commitment_params.new_collaborators` map
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      acceptChannelTransfer: AugmentedSubmittable<(channelId: u64 | AnyNumber | Uint8Array, commitmentParams: PalletContentTransferCommitmentParametersBTreeMap | { newCollaborators?: any; price?: any; transferId?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletContentTransferCommitmentParametersBTreeMap]>;
      /**
       * Accept incoming Nft offer
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      acceptIncomingOffer: AugmentedSubmittable<(videoId: u64 | AnyNumber | Uint8Array, witnessPrice: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
      /**
       * Add curator to curator group under given `curator_group_id`
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addCuratorToGroup: AugmentedSubmittable<(curatorGroupId: u64 | AnyNumber | Uint8Array, curatorId: u64 | AnyNumber | Uint8Array, permissions: BTreeSet<PalletContentIterableEnumsChannelActionPermission>) => SubmittableExtrinsic<ApiType>, [u64, u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>]>;
      /**
       * Buy Nft
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      buyNft: AugmentedSubmittable<(videoId: u64 | AnyNumber | Uint8Array, participantId: u64 | AnyNumber | Uint8Array, witnessPrice: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u128]>;
      /**
       * Cancel Nft sell order
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * </weight>
       **/
      cancelBuyNow: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * cancel channel transfer
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelChannelTransfer: AugmentedSubmittable<(channelId: u64 | AnyNumber | Uint8Array, actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletContentPermissionsContentActor]>;
      /**
       * Cancel video nft english auction
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      cancelEnglishAuction: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * Cancel Nft offer
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      cancelOffer: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * Cancel video nft open auction
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      cancelOpenAuction: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * Cancel open auction bid
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      cancelOpenAuctionBid: AugmentedSubmittable<(participantId: u64 | AnyNumber | Uint8Array, videoId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Channel collaborator remark
       * <weight>
       * 
       * ## Weight
       * `O (B)`
       * - DB:
       * - O(1)
       * where:
       * - B is the byte lenght of `msg`
       * # </weight>
       **/
      channelAgentRemark: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, Bytes]>;
      /**
       * Channel owner remark
       * <weight>
       * 
       * ## Weight
       * `O (B)`
       * - DB:
       * - O(1)
       * where:
       * - B is the kilobyte lenght of `msg`
       * # </weight>
       **/
      channelOwnerRemark: AugmentedSubmittable<(channelId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
      /**
       * Claim and withdraw reward in JOY from channel account
       * 
       * <weight>
       * 
       * ## Weight
       * `O (H)` where:
       * - `H` is the lenght of the provided merkle `proof`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      claimAndWithdrawChannelReward: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, proof: Vec<PalletCommonMerkleTreeProofElementRecord> | (PalletCommonMerkleTreeProofElementRecord | { hash_?: any; side?: any } | string | Uint8Array)[], item: PalletContentPullPaymentElement | { channelId?: any; cumulativeRewardEarned?: any; reason?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, Vec<PalletCommonMerkleTreeProofElementRecord>, PalletContentPullPaymentElement]>;
      /**
       * Claim reward in JOY from channel account
       * 
       * <weight>
       * 
       * ## Weight
       * `O (H)` where:
       * - `H` is the lenght of the provided merkle `proof`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      claimChannelReward: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, proof: Vec<PalletCommonMerkleTreeProofElementRecord> | (PalletCommonMerkleTreeProofElementRecord | { hash_?: any; side?: any } | string | Uint8Array)[], item: PalletContentPullPaymentElement | { channelId?: any; cumulativeRewardEarned?: any; reason?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, Vec<PalletCommonMerkleTreeProofElementRecord>, PalletContentPullPaymentElement]>;
      /**
       * Claim channel's creator token patronage credit
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      claimCreatorTokenPatronageCredit: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C + D + E)` where:
       * - `A` is the number of entries in `params.collaborators`
       * - `B` is the number of items in `params.storage_buckets`
       * - `C` is the number of items in `params.distribution_buckets`
       * - `D` is the number of items in `params.assets.object_creation_list`
       * - `E` is the size of  `params.meta` in kilobytes
       * - DB:
       * - `O(A + B + C + D)` - from the the generated weights
       * # </weight>
       **/
      createChannel: AugmentedSubmittable<(channelOwner: PalletContentChannelOwner | { Member: any } | { CuratorGroup: any } | string | Uint8Array, params: PalletContentChannelCreationParametersRecord | { assets?: any; meta?: any; collaborators?: any; storageBuckets?: any; distributionBuckets?: any; expectedChannelStateBloatBond?: any; expectedDataObjectStateBloatBond?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentChannelOwner, PalletContentChannelCreationParametersRecord]>;
      /**
       * Add new curator group to runtime storage
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the number of entries in `permissions_by_level` map
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createCuratorGroup: AugmentedSubmittable<(isActive: bool | boolean | Uint8Array, permissionsByLevel: BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>) => SubmittableExtrinsic<ApiType>, [bool, BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C + D)` where:
       * - `A` is the number of items in `params.assets.object_creation_list`
       * - `B` is `params.storage_buckets_num_witness`
       * - `C` is the length of open auction / english auction whitelist (if provided)
       * - `D` is the size of `params.meta` in kilobytes (if provided)
       * - DB:
       * - `O(A + B + C)` - from the the generated weights
       * # </weight>
       **/
      createVideo: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, params: PalletContentVideoCreationParametersRecord | { assets?: any; meta?: any; autoIssueNft?: any; expectedVideoStateBloatBond?: any; expectedDataObjectStateBloatBond?: any; storageBucketsNumWitness?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentVideoCreationParametersRecord]>;
      /**
       * Perform transfer of tokens as creator token issuer
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A + B)` where:
       * - `A` is the number of entries in `outputs`
       * - `B` is the size of the `metadata` in kilobytes
       * - DB:
       * - `O(A)` - from the the generated weights
       * # </weight>
       **/
      creatorTokenIssuerTransfer: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, outputs: PalletProjectTokenTransfersPaymentWithVesting, metadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletProjectTokenTransfersPaymentWithVesting, Bytes]>;
      /**
       * Deissue channel's creator token
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      deissueCreatorToken: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C)` where:
       * - `A` is `num_objects_to_delete`
       * - `B` is `channel_bag_witness.storage_buckets_num`
       * - `C` is `channel_bag_witness.distribution_buckets_num`
       * - DB:
       * - `O(A + B + C)` - from the the generated weights
       * # </weight>
       **/
      deleteChannel: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, channelBagWitness: PalletContentChannelBagWitness | { storageBucketsNum?: any; distributionBucketsNum?: any } | string | Uint8Array, numObjectsToDelete: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentChannelBagWitness, u64]>;
      deleteChannelAsModerator: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, channelBagWitness: PalletContentChannelBagWitness | { storageBucketsNum?: any; distributionBucketsNum?: any } | string | Uint8Array, numObjectsToDelete: u64 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentChannelBagWitness, u64, Bytes]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C)` where:
       * - `A` is the length of `assets_to_remove`
       * - `B` is the value of `storage_buckets_num_witness`
       * - `C` is the size of `rationale` in kilobytes
       * - DB:
       * - `O(A + B)` - from the the generated weights
       * # </weight>
       **/
      deleteChannelAssetsAsModerator: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, assetsToRemove: BTreeSet<u64>, storageBucketsNumWitness: u32 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, BTreeSet<u64>, u32, Bytes]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B)` where:
       * - `A` is num_objects_to_delete
       * - `B` is `params.storage_buckets_num_witness` (if provided)
       * - DB:
       * - `O(A + B)` - from the the generated weights
       * # </weight>
       **/
      deleteVideo: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, numObjectsToDelete: u64 | AnyNumber | Uint8Array, storageBucketsNumWitness: Option<u32> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, u64, Option<u32>]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C)` where:
       * - `A` is the value of `num_objects_to_delete`
       * - `B` is the value of `storage_buckets_num_witness`
       * - `C` is the size of `rationale` in kilobytes
       * - DB:
       * - `O(A + B)` - from the the generated weights
       * # </weight>
       **/
      deleteVideoAsModerator: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, storageBucketsNumWitness: Option<u32> | null | object | string | Uint8Array, numObjectsToDelete: u64 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, Option<u32>, u64, Bytes]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C)` where:
       * - `A` is the length of `assets_to_remove`
       * - `B` is the value of `storage_buckets_num_witness`
       * - `C` is the size of `rationale` in kilobytes
       * - DB:
       * - `O(A + B)` - from the the generated weights
       * # </weight>
       **/
      deleteVideoAssetsAsModerator: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, storageBucketsNumWitness: u32 | AnyNumber | Uint8Array, assetsToRemove: BTreeSet<u64>, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, u32, BTreeSet<u64>, Bytes]>;
      /**
       * Destroy NFT
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      destroyNft: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * Finalize an ended creator token sale
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      finalizeCreatorTokenSale: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * Finalize an ended revenue split
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      finalizeRevenueSplit: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * Initialize creator token sale
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the size of `params.metadata` in kilobytes (or 0 if not provided)
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      initCreatorTokenSale: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, params: PalletProjectTokenTokenSaleParams | { unitPrice?: any; upperBoundQuantity?: any; startsAt?: any; duration?: any; vestingScheduleParams?: any; capPerMember?: any; metadata?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletProjectTokenTokenSaleParams]>;
      /**
       * Start a channel transfer with specified characteristics
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the number of entries in `transfer_params.new_collaborators` map
       * - DB:
       * - O(A) - from the the generated weights
       * # </weight>
       **/
      initializeChannelTransfer: AugmentedSubmittable<(channelId: u64 | AnyNumber | Uint8Array, actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, transferParams: PalletContentInitTransferParameters | { newCollaborators?: any; price?: any; newOwner?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletContentPermissionsContentActor, PalletContentInitTransferParameters]>;
      /**
       * Issue creator token
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the number of entries in `params.initial_allocation` map
       * - DB:
       * - `O(A)` - from the the generated weights
       * # </weight>
       **/
      issueCreatorToken: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, params: PalletProjectTokenTokenIssuanceParameters | { initialAllocation?: any; symbol?: any; transferPolicy?: any; patronageRate?: any; revenueSplitRate?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletProjectTokenTokenIssuanceParameters]>;
      /**
       * Issue NFT
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + B)`
       * - DB:
       * - O(W)
       * where:
       * - W : member whitelist length in case nft initial status is auction
       * - B : size of metadata parameter in kilobytes
       * # </weight>
       **/
      issueNft: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, params: PalletContentNftTypesNftIssuanceParametersRecord | { royalty?: any; nftMetadata?: any; nonChannelOwner?: any; initTransactionalStatus?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentNftTypesNftIssuanceParametersRecord]>;
      /**
       * Issue revenue split for a channel
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      issueRevenueSplit: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, start: Option<u32> | null | object | string | Uint8Array, duration: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, Option<u32>, u32]>;
      /**
       * Make channel's creator token permissionless
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      makeCreatorTokenPermissionless: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64]>;
      /**
       * Make english auction bid
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      makeEnglishAuctionBid: AugmentedSubmittable<(participantId: u64 | AnyNumber | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, bidAmount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u128]>;
      /**
       * Make auction bid
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      makeOpenAuctionBid: AugmentedSubmittable<(participantId: u64 | AnyNumber | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, bidAmount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u128]>;
      /**
       * NFT owner remark
       * <weight>
       * 
       * ## Weight
       * `O (B)`
       * - DB:
       * - O(1)
       * where:
       * - B is the byte lenght of `msg`
       * # </weight>
       **/
      nftOwnerRemark: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, Bytes]>;
      /**
       * Offer Nft
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      offerNft: AugmentedSubmittable<(videoId: u64 | AnyNumber | Uint8Array, ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, to: u64 | AnyNumber | Uint8Array, price: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletContentPermissionsContentActor, u64, Option<u128>]>;
      /**
       * Accept open auction bid
       * Should only be called by auctioneer
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      pickOpenAuctionWinner: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, winnerId: u64 | AnyNumber | Uint8Array, commit: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, u64, u128]>;
      /**
       * Reduce channel's creator token patronage rate to given value
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      reduceCreatorTokenPatronageRateTo: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, targetRate: Permill | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, Permill]>;
      /**
       * Remove curator from a given curator group
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      removeCuratorFromGroup: AugmentedSubmittable<(curatorGroupId: u64 | AnyNumber | Uint8Array, curatorId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Sell Nft
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      sellNft: AugmentedSubmittable<(videoId: u64 | AnyNumber | Uint8Array, ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, price: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletContentPermissionsContentActor, u128]>;
      /**
       * Extrinsic for pausing/re-enabling channel features
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setChannelPausedFeaturesAsModerator: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, newPausedFeatures: BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature>, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature>, Bytes]>;
      /**
       * Extrinsic for setting channel visibility status (hidden/visible) by moderator
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setChannelVisibilityAsModerator: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, isHidden: bool | boolean | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, bool, Bytes]>;
      /**
       * Set `is_active` status for curator group under given `curator_group_id`
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setCuratorGroupStatus: AugmentedSubmittable<(curatorGroupId: u64 | AnyNumber | Uint8Array, isActive: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, bool]>;
      /**
       * Claim won english auction
       * Can be called by anyone
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      settleEnglishAuction: AugmentedSubmittable<(videoId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Extrinsic for video visibility status (hidden/visible) setting by moderator
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setVideoVisibilityAsModerator: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, isHidden: bool | boolean | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, bool, Bytes]>;
      /**
       * Return Nft back to the original artist at no cost
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      slingNftBack: AugmentedSubmittable<(videoId: u64 | AnyNumber | Uint8Array, ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletContentPermissionsContentActor]>;
      /**
       * Start video nft english auction
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - W : whitelist member list length
       * - DB:
       * - O(W)
       * # </weight>
       **/
      startEnglishAuction: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, auctionParams: PalletContentNftTypesEnglishAuctionParamsRecord | { startingPrice?: any; buyNowPrice?: any; whitelist?: any; startsAt?: any; duration?: any; extensionPeriod?: any; minBidStep?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentNftTypesEnglishAuctionParamsRecord]>;
      /**
       * Start video nft open auction
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - W : member whitelist length
       * - DB:
       * - O(W)
       * # </weight>
       **/
      startOpenAuction: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, auctionParams: PalletContentNftTypesOpenAuctionParamsRecord | { startingPrice?: any; buyNowPrice?: any; startsAt?: any; whitelist?: any; bidLockDuration?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentNftTypesOpenAuctionParamsRecord]>;
      /**
       * Only Council can toggle nft issuance limits constraints
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      toggleNftLimits: AugmentedSubmittable<(enabled: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [bool]>;
      /**
       * Update Buy now nft price
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      updateBuyNowPrice: AugmentedSubmittable<(ownerId: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, newPrice: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, u128]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C + D + E)` where:
       * - `A` is the number of entries in `params.collaborators`
       * - `B` is the number of items in `params.assets_to_upload.object_creation_list` (if provided)
       * - `C` is the number of items in `params.assets_to_remove`
       * - `D` is the size of `params.new_meta` in kilobytes
       * - `E` is `params.storage_buckets_num_witness` (if provided)
       * - DB:
       * - `O(A + B + C + E)` - from the the generated weights
       * # </weight>
       **/
      updateChannel: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, params: PalletContentChannelUpdateParametersRecord | { assetsToUpload?: any; newMeta?: any; assetsToRemove?: any; collaborators?: any; expectedDataObjectStateBloatBond?: any; storageBucketsNumWitness?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentChannelUpdateParametersRecord]>;
      /**
       * Updates channel's NFT limit.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      updateChannelNftLimit: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, nftLimitPeriod: PalletContentNftLimitPeriod | 'Daily' | 'Weekly' | number | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, limit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, PalletContentNftLimitPeriod, u64, u64]>;
      /**
       * Update channel payouts
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)` where:
       * - DB:
       * - O(1)
       * # </weight>
       **/
      updateChannelPayouts: AugmentedSubmittable<(params: PalletContentUpdateChannelPayoutsParametersRecord | { commitment?: any; payload?: any; minCashoutAllowed?: any; maxCashoutAllowed?: any; channelCashoutsEnabled?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentUpdateChannelPayoutsParametersRecord]>;
      /**
       * Extrinsic for updating channel privilege level (requires lead access)
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateChannelPrivilegeLevel: AugmentedSubmittable<(channelId: u64 | AnyNumber | Uint8Array, newPrivilegeLevel: u8 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u8]>;
      /**
       * Updates channel state bloat bond value.
       * Only lead can upload this value
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      updateChannelStateBloatBond: AugmentedSubmittable<(newChannelStateBloatBond: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Update existing curator group's permissions
       * 
       * <weight>
       * 
       * ## Weight
       * `O (A)` where:
       * - `A` is the number of entries in `permissions_by_level` map
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateCuratorGroupPermissions: AugmentedSubmittable<(curatorGroupId: u64 | AnyNumber | Uint8Array, permissionsByLevel: BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>) => SubmittableExtrinsic<ApiType>, [u64, BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>]>;
      /**
       * Updates global NFT limit
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      updateGlobalNftLimit: AugmentedSubmittable<(nftLimitPeriod: PalletContentNftLimitPeriod | 'Daily' | 'Weekly' | number | Uint8Array, limit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentNftLimitPeriod, u64]>;
      /**
       * Update upcoming creator token sale
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateUpcomingCreatorTokenSale: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, newStartBlock: Option<u32> | null | object | string | Uint8Array, newDuration: Option<u32> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, Option<u32>, Option<u32>]>;
      /**
       * <weight>
       * 
       * ## Weight
       * `O (A + B + C + D + E)` where:
       * - `A` is params.assets_to_upload.object_creation_list.len() (if provided)
       * - `B` is params.assets_to_remove.len()
       * - `C` is `params.storage_buckets_num_witness` (if provided)
       * - `D` is the length of open auction / english auction whitelist (if provided)
       * - `E` is the size of `params.new_meta` in kilobytes (if provided)
       * - DB:
       * - `O(A + B + C + D)` - from the the generated weights
       * # </weight>
       **/
      updateVideo: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, videoId: u64 | AnyNumber | Uint8Array, params: PalletContentVideoUpdateParametersRecord | { assetsToUpload?: any; newMeta?: any; assetsToRemove?: any; autoIssueNft?: any; expectedDataObjectStateBloatBond?: any; storageBucketsNumWitness?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, PalletContentVideoUpdateParametersRecord]>;
      /**
       * Updates video state bloat bond value.
       * Only lead can upload this value
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      updateVideoStateBloatBond: AugmentedSubmittable<(newVideoStateBloatBond: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Withdraw JOY from channel account
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1)
       * # </weight>
       **/
      withdrawFromChannelBalance: AugmentedSubmittable<(actor: PalletContentPermissionsContentActor | { Curator: any } | { Member: any } | { Lead: any } | string | Uint8Array, channelId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletContentPermissionsContentActor, u64, u128]>;
    };
    contentWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
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
      announceCandidacy: AugmentedSubmittable<(membershipId: u64 | AnyNumber | Uint8Array, stakingAccountId: AccountId32 | string | Uint8Array, rewardAccountId: AccountId32 | string | Uint8Array, stake: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32, AccountId32, u128]>;
      /**
       * Candidate makes a remark message
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      candidateRemark: AugmentedSubmittable<(candidateId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
      /**
       * Councilor makes a remark message
       * 
       * # <weight>
       * 
       * ## weight
       * `O (1)`
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      councilorRemark: AugmentedSubmittable<(councilorId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
      /**
       * Fund the council budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundCouncilBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      fundingRequest: AugmentedSubmittable<(fundingRequests: Vec<PalletCommonFundingRequestParameters> | (PalletCommonFundingRequestParameters | { account?: any; amount?: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<PalletCommonFundingRequestParameters>]>;
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
      planBudgetRefill: AugmentedSubmittable<(nextRefill: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
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
      releaseCandidacyStake: AugmentedSubmittable<(membershipId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      setBudget: AugmentedSubmittable<(balance: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
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
      setBudgetIncrement: AugmentedSubmittable<(budgetIncrement: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Set short description for the user's candidacy. Can be called anytime during user's candidacy.
       * 
       * # <weight>
       * 
       * ## weight
       * `O (N)` where:
       * `N` is the size of `note` in kilobytes
       * - db:
       * - `O(1)` doesn't depend on the state or parameters
       * # </weight>
       **/
      setCandidacyNote: AugmentedSubmittable<(membershipId: u64 | AnyNumber | Uint8Array, note: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
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
      setCouncilorReward: AugmentedSubmittable<(councilorReward: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
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
      withdrawCandidacy: AugmentedSubmittable<(membershipId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
    };
    distributionWorkingGroup: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
    };
    electionProviderMultiPhase: {
      /**
       * Trigger the governance fallback.
       * 
       * This can only be called when [`Phase::Emergency`] is enabled, as an alternative to
       * calling [`Call::set_emergency_election_result`].
       **/
      governanceFallback: AugmentedSubmittable<(maybeMaxVoters: Option<u32> | null | object | string | Uint8Array, maybeMaxTargets: Option<u32> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<u32>, Option<u32>]>;
      /**
       * Set a solution in the queue, to be handed out to the client of this pallet in the next
       * call to `ElectionProvider::elect`.
       * 
       * This can only be set by `T::ForceOrigin`, and only when the phase is `Emergency`.
       * 
       * The solution is not checked for any feasibility and is assumed to be trustworthy, as any
       * feasibility check itself can in principle cause the election process to fail (due to
       * memory/weight constrains).
       **/
      setEmergencyElectionResult: AugmentedSubmittable<(supports: Vec<ITuple<[AccountId32, SpNposElectionsSupport]>> | ([AccountId32 | string | Uint8Array, SpNposElectionsSupport | { total?: any; voters?: any } | string | Uint8Array])[]) => SubmittableExtrinsic<ApiType>, [Vec<ITuple<[AccountId32, SpNposElectionsSupport]>>]>;
      /**
       * Set a new value for `MinimumUntrustedScore`.
       * 
       * Dispatch origin must be aligned with `T::ForceOrigin`.
       * 
       * This check can be turned off by setting the value to `None`.
       **/
      setMinimumUntrustedScore: AugmentedSubmittable<(maybeNextScore: Option<SpNposElectionsElectionScore> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<SpNposElectionsElectionScore>]>;
      /**
       * Submit a solution for the signed phase.
       * 
       * The dispatch origin fo this call must be __signed__.
       * 
       * The solution is potentially queued, based on the claimed score and processed at the end
       * of the signed phase.
       * 
       * A deposit is reserved and recorded for the solution. Based on the outcome, the solution
       * might be rewarded, slashed, or get all or a part of the deposit back.
       **/
      submit: AugmentedSubmittable<(rawSolution: PalletElectionProviderMultiPhaseRawSolution | { solution?: any; score?: any; round?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletElectionProviderMultiPhaseRawSolution]>;
      /**
       * Submit a solution for the unsigned phase.
       * 
       * The dispatch origin fo this call must be __none__.
       * 
       * This submission is checked on the fly. Moreover, this unsigned solution is only
       * validated when submitted to the pool from the **local** node. Effectively, this means
       * that only active validators can submit this transaction when authoring a block (similar
       * to an inherent).
       * 
       * To prevent any incorrect solution (and thus wasted time/weight), this transaction will
       * panic if the solution submitted by the validator is invalid in any way, effectively
       * putting their authoring reward at risk.
       * 
       * No deposit or reward is associated with this submission.
       **/
      submitUnsigned: AugmentedSubmittable<(rawSolution: PalletElectionProviderMultiPhaseRawSolution | { solution?: any; score?: any; round?: any } | string | Uint8Array, witness: PalletElectionProviderMultiPhaseSolutionOrSnapshotSize | { voters?: any; targets?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletElectionProviderMultiPhaseRawSolution, PalletElectionProviderMultiPhaseSolutionOrSnapshotSize]>;
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
       * - `V` is the size of the text in kilobytes
       * - DB:
       * - O(W)
       * # </weight>
       **/
      addPost: AugmentedSubmittable<(forumUserId: u64 | AnyNumber | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array, editable: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64, Bytes, bool]>;
      /**
       * Add a new category.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X)` where:
       * - `W` is the category depth
       * - `V` is the size of the category title in kilobytes.
       * - `X` is the size of the category description in kilobytes.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      createCategory: AugmentedSubmittable<(parentCategoryId: Option<u64> | null | object | string | Uint8Array, title: Bytes | string | Uint8Array, description: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<u64>, Bytes, Bytes]>;
      /**
       * Create new thread in category
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X)` where:
       * - `W` is the category depth
       * - `V` is the size of the thread title in kilobytes.
       * - `X` is the size of the thread text in kilobytes.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      createThread: AugmentedSubmittable<(forumUserId: u64 | AnyNumber | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, metadata: Bytes | string | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, Bytes, Bytes]>;
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
      deleteCategory: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64]>;
      /**
       * Delete post from storage.
       * You need to provide a vector of posts to delete in the form
       * (T::CategoryId, T::ThreadId, T::PostId, bool)
       * where the last bool is whether you want to hide it apart from deleting it
       * 
       * ## Weight
       * `O (W + V + P)` where:
       * - `W` is the category depth,
       * - `V` is the size of the rationale in kilobytes
       * - `P` is the number of posts to delete
       * - DB:
       * - O(W + P)
       * # </weight>
       **/
      deletePosts: AugmentedSubmittable<(forumUserId: u64 | AnyNumber | Uint8Array, posts: BTreeMap<PalletForumExtendedPostIdObject, bool>, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, BTreeMap<PalletForumExtendedPostIdObject, bool>, Bytes]>;
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
      deleteThread: AugmentedSubmittable<(forumUserId: u64 | AnyNumber | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, hide: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64, bool]>;
      /**
       * Edit post text
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth,
       * - `V` is the size of the new text in kilobytes
       * - DB:
       * - O(W)
       * # </weight>
       **/
      editPostText: AugmentedSubmittable<(forumUserId: u64 | AnyNumber | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, postId: u64 | AnyNumber | Uint8Array, newText: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64, u64, Bytes]>;
      /**
       * Edit thread metadata
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth
       * - `V` is the size of the thread metadata in kilobytes.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      editThreadMetadata: AugmentedSubmittable<(forumUserId: u64 | AnyNumber | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, newMetadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64, Bytes]>;
      /**
       * Moderate post
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth,
       * - `V` is the size of the rationale in kilobytes
       * - DB:
       * - O(W)
       * # </weight>
       **/
      moderatePost: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, postId: u64 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64, u64, u64, Bytes]>;
      /**
       * Moderate thread
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V + X)` where:
       * - `W` is the category depth,
       * - `V` is the number of thread posts,
       * - `X` is the size of the rationale in kilobytes
       * - DB:
       * - O(W + V)
       * # </weight>
       **/
      moderateThread: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64, u64, Bytes]>;
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
      moveThreadToCategory: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, newCategoryId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64, u64, u64]>;
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
      setStickiedThreads: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, stickiedIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64, BTreeSet<u64>]>;
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
      updateCategoryArchivalStatus: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, newArchivalStatus: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64, bool]>;
      /**
       * Update category description
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the category depth
       * - `V` is the size of the category description in kilobytes.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      updateCategoryDescription: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, description: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64, Bytes]>;
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
      updateCategoryMembershipOfModerator: AugmentedSubmittable<(moderatorId: u64 | AnyNumber | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, newValue: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, bool]>;
      /**
       * Update category title
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the category depth
       * - `V` is the size of the category title in kilobytes.
       * - DB:
       * - O(W)
       * # </weight>
       **/
      updateCategoryTitle: AugmentedSubmittable<(actor: PalletForumPrivilegedActor | { Lead: any } | { Moderator: any } | string | Uint8Array, categoryId: u64 | AnyNumber | Uint8Array, title: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletForumPrivilegedActor, u64, Bytes]>;
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
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
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
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
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
      noteStalled: AugmentedSubmittable<(delay: u32 | AnyNumber | Uint8Array, bestFinalizedBlockNumber: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, u32]>;
      /**
       * Report voter equivocation/misbehavior. This method will verify the
       * equivocation proof and validate the given key ownership proof
       * against the extracted offender. If both are valid, the offence
       * will be reported.
       **/
      reportEquivocation: AugmentedSubmittable<(equivocationProof: SpFinalityGrandpaEquivocationProof | { setId?: any; equivocation?: any } | string | Uint8Array, keyOwnerProof: SpSessionMembershipProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [SpFinalityGrandpaEquivocationProof, SpSessionMembershipProof]>;
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
      reportEquivocationUnsigned: AugmentedSubmittable<(equivocationProof: SpFinalityGrandpaEquivocationProof | { setId?: any; equivocation?: any } | string | Uint8Array, keyOwnerProof: SpSessionMembershipProof | { session?: any; trieNodes?: any; validatorCount?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [SpFinalityGrandpaEquivocationProof, SpSessionMembershipProof]>;
    };
    imOnline: {
      /**
       * # <weight>
       * - Complexity: `O(K + E)` where K is length of `Keys` (heartbeat.validators_len) and E is
       * length of `heartbeat.network_state.external_address`
       * - `O(K)`: decoding of length `K`
       * - `O(E)`: decoding/encoding of length `E`
       * - DbReads: pallet_session `Validators`, pallet_session `CurrentIndex`, `Keys`,
       * `ReceivedHeartbeats`
       * - DbWrites: `ReceivedHeartbeats`
       * # </weight>
       **/
      heartbeat: AugmentedSubmittable<(heartbeat: PalletImOnlineHeartbeat | { blockNumber?: any; networkState?: any; sessionIndex?: any; authorityIndex?: any; validatorsLen?: any } | string | Uint8Array, signature: PalletImOnlineSr25519AppSr25519Signature | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletImOnlineHeartbeat, PalletImOnlineSr25519AppSr25519Signature]>;
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
      burnAccountTokens: AugmentedSubmittable<(amount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
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
       * #[weight = (T::BlockWeights::get().get(DispatchClass::Operational).base_extrinsic, DispatchClass::Operational)]
       **/
      executeRuntimeUpgradeProposal: AugmentedSubmittable<(wasm: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Signal proposal extrinsic. Should be used as callable object to pass to the `engine` module.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the signal in kilobytes
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
      updateWorkingGroupBudget: AugmentedSubmittable<(workingGroup: PalletCommonWorkingGroupIterableEnumsWorkingGroup | 'Forum' | 'Storage' | 'Content' | 'OperationsAlpha' | 'Gateway' | 'Distribution' | 'OperationsBeta' | 'OperationsGamma' | 'Membership' | number | Uint8Array, amount: u128 | AnyNumber | Uint8Array, balanceKind: PalletCommonBalanceKind | 'Positive' | 'Negative' | number | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletCommonWorkingGroupIterableEnumsWorkingGroup, u128, PalletCommonBalanceKind]>;
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
      addStakingAccountCandidate: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Non-members can buy membership.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + M)` where:
       * - `W` is the handle size in kilobytes
       * - `M` is the metadata size in kilobytes
       * - DB:
       * - O(1)
       * # </weight>
       **/
      buyMembership: AugmentedSubmittable<(params: PalletMembershipBuyMembershipParameters | { rootAccount?: any; controllerAccount?: any; handle?: any; metadata?: any; referrerId?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletMembershipBuyMembershipParameters]>;
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
      confirmStakingAccount: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, stakingAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
      /**
       * Create a member profile as root.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (I + J)` where:
       * - `I` is the handle size in kilobytes
       * - `J` is the metadata size in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createMember: AugmentedSubmittable<(params: PalletMembershipCreateMemberParameters | { rootAccount?: any; controllerAccount?: any; handle?: any; metadata?: any; isFoundingMember?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletMembershipCreateMemberParameters]>;
      /**
       * Gift a membership using own funds. Gifter does not need to be a member.
       * Can optinally apply a lock on a portion of the funds transferred to root and controller
       * accounts. Gifter also pays the membership fee.
       **/
      giftMembership: AugmentedSubmittable<(params: PalletMembershipGiftMembershipParameters | { rootAccount?: any; controllerAccount?: any; handle?: any; metadata?: any; creditControllerAccount?: any; applyControllerAccountInvitationLock?: any; creditRootAccount?: any; applyRootAccountInvitationLock?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletMembershipGiftMembershipParameters]>;
      /**
       * Invite a new member.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + M)` where:
       * - `W` is the handle size in kilobytes
       * - `M` is the metadata size in kilobytes
       * - DB:
       * - O(1)
       * # </weight>
       **/
      inviteMember: AugmentedSubmittable<(params: PalletMembershipInviteMembershipParameters | { invitingMemberId?: any; rootAccount?: any; controllerAccount?: any; handle?: any; metadata?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletMembershipInviteMembershipParameters]>;
      /**
       * Member makes a remark
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      memberRemark: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
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
      removeStakingAccount: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      setInitialInvitationBalance: AugmentedSubmittable<(newInitialBalance: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
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
      setMembershipPrice: AugmentedSubmittable<(newPrice: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
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
      transferInvites: AugmentedSubmittable<(sourceMemberId: u64 | AnyNumber | Uint8Array, targetMemberId: u64 | AnyNumber | Uint8Array, numberOfInvites: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u32]>;
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
      updateAccounts: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, newRootAccount: Option<AccountId32> | null | object | string | Uint8Array, newControllerAccount: Option<AccountId32> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<AccountId32>, Option<AccountId32>]>;
      /**
       * Update member's all or some of name, handle, avatar and about text.
       * No effect if no changed fields.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (W + M)` where:
       * - `W` is the handle size in kilobytes
       * - `M` is the metadata size in kilobytes
       * - DB:
       * - O(1)
       * # </weight>
       **/
      updateProfile: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, handle: Option<Bytes> | null | object | string | Uint8Array, metadata: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>, Option<Bytes>]>;
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
      updateProfileVerification: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, targetMemberId: u64 | AnyNumber | Uint8Array, isVerified: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, bool]>;
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
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
    };
    multisig: {
      /**
       * Register approval for a dispatch to be made from a deterministic composite account if
       * approved by a total of `threshold - 1` of `other_signatories`.
       * 
       * Payment: `DepositBase` will be reserved if this is the first approval, plus
       * `threshold` times `DepositFactor`. It is returned once this dispatch happens or
       * is cancelled.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `threshold`: The total number of approvals for this dispatch before it is executed.
       * - `other_signatories`: The accounts (other than the sender) who can approve this
       * dispatch. May not be empty.
       * - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
       * not the first approval, then it must be `Some`, with the timepoint (block number and
       * transaction index) of the first approval transaction.
       * - `call_hash`: The hash of the call to be executed.
       * 
       * NOTE: If this is the final approval, you will want to use `as_multi` instead.
       * 
       * # <weight>
       * - `O(S)`.
       * - Up to one balance-reserve or unreserve operation.
       * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
       * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
       * - One encode & hash, both of complexity `O(S)`.
       * - Up to one binary search and insert (`O(logS + S)`).
       * - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
       * - One event.
       * - Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
       * taken for its lifetime of `DepositBase + threshold * DepositFactor`.
       * ----------------------------------
       * - DB Weight:
       * - Read: Multisig Storage, [Caller Account]
       * - Write: Multisig Storage, [Caller Account]
       * # </weight>
       **/
      approveAsMulti: AugmentedSubmittable<(threshold: u16 | AnyNumber | Uint8Array, otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], maybeTimepoint: Option<PalletMultisigTimepoint> | null | object | string | Uint8Array, callHash: U8aFixed | string | Uint8Array, maxWeight: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Vec<AccountId32>, Option<PalletMultisigTimepoint>, U8aFixed, u64]>;
      /**
       * Register approval for a dispatch to be made from a deterministic composite account if
       * approved by a total of `threshold - 1` of `other_signatories`.
       * 
       * If there are enough, then dispatch the call.
       * 
       * Payment: `DepositBase` will be reserved if this is the first approval, plus
       * `threshold` times `DepositFactor`. It is returned once this dispatch happens or
       * is cancelled.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `threshold`: The total number of approvals for this dispatch before it is executed.
       * - `other_signatories`: The accounts (other than the sender) who can approve this
       * dispatch. May not be empty.
       * - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
       * not the first approval, then it must be `Some`, with the timepoint (block number and
       * transaction index) of the first approval transaction.
       * - `call`: The call to be executed.
       * 
       * NOTE: Unless this is the final approval, you will generally want to use
       * `approve_as_multi` instead, since it only requires a hash of the call.
       * 
       * Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
       * on success, result is `Ok` and the result from the interior call, if it was executed,
       * may be found in the deposited `MultisigExecuted` event.
       * 
       * # <weight>
       * - `O(S + Z + Call)`.
       * - Up to one balance-reserve or unreserve operation.
       * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
       * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
       * - One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
       * - One encode & hash, both of complexity `O(S)`.
       * - Up to one binary search and insert (`O(logS + S)`).
       * - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
       * - One event.
       * - The weight of the `call`.
       * - Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
       * taken for its lifetime of `DepositBase + threshold * DepositFactor`.
       * -------------------------------
       * - DB Weight:
       * - Reads: Multisig Storage, [Caller Account], Calls (if `store_call`)
       * - Writes: Multisig Storage, [Caller Account], Calls (if `store_call`)
       * - Plus Call Weight
       * # </weight>
       **/
      asMulti: AugmentedSubmittable<(threshold: u16 | AnyNumber | Uint8Array, otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], maybeTimepoint: Option<PalletMultisigTimepoint> | null | object | string | Uint8Array, call: WrapperKeepOpaque<Call> | object | string | Uint8Array, storeCall: bool | boolean | Uint8Array, maxWeight: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Vec<AccountId32>, Option<PalletMultisigTimepoint>, WrapperKeepOpaque<Call>, bool, u64]>;
      /**
       * Immediately dispatch a multi-signature call using a single approval from the caller.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `other_signatories`: The accounts (other than the sender) who are part of the
       * multi-signature, but do not participate in the approval process.
       * - `call`: The call to be executed.
       * 
       * Result is equivalent to the dispatched result.
       * 
       * # <weight>
       * O(Z + C) where Z is the length of the call and C its execution weight.
       * -------------------------------
       * - DB Weight: None
       * - Plus Call Weight
       * # </weight>
       **/
      asMultiThreshold1: AugmentedSubmittable<(otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>, Call]>;
      /**
       * Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
       * for this operation will be unreserved on success.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `threshold`: The total number of approvals for this dispatch before it is executed.
       * - `other_signatories`: The accounts (other than the sender) who can approve this
       * dispatch. May not be empty.
       * - `timepoint`: The timepoint (block number and transaction index) of the first approval
       * transaction for this dispatch.
       * - `call_hash`: The hash of the call to be executed.
       * 
       * # <weight>
       * - `O(S)`.
       * - Up to one balance-reserve or unreserve operation.
       * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
       * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
       * - One encode & hash, both of complexity `O(S)`.
       * - One event.
       * - I/O: 1 read `O(S)`, one remove.
       * - Storage: removes one item.
       * ----------------------------------
       * - DB Weight:
       * - Read: Multisig Storage, [Caller Account], Refund Account, Calls
       * - Write: Multisig Storage, [Caller Account], Refund Account, Calls
       * # </weight>
       **/
      cancelAsMulti: AugmentedSubmittable<(threshold: u16 | AnyNumber | Uint8Array, otherSignatories: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[], timepoint: PalletMultisigTimepoint | { height?: any; index?: any } | string | Uint8Array, callHash: U8aFixed | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Vec<AccountId32>, PalletMultisigTimepoint, U8aFixed]>;
    };
    operationsWorkingGroupAlpha: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
    };
    operationsWorkingGroupBeta: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
    };
    operationsWorkingGroupGamma: {
      /**
       * Add a job opening for a regular worker/lead role.
       * Require signed leader origin or the root (to add opening for the leader position).
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
    };
    projectToken: {
      /**
       * Burn tokens from specified account
       * 
       * Preconditions:
       * - `amount` is > 0
       * - origin signer is a controller account of `member_id` member
       * - token by `token_id` exists
       * - an account exists for `token_id` x `member_id`
       * - account's tokens amount is >= `amount`
       * - token supply can be modified (there is no active revenue split)
       * 
       * Postconditions:
       * - starting with `unprocessed` beeing equal to `amount`, account's vesting schedules
       * are iterated over and:
       * - updated with `burned_amount += uprocessed` if vesting schedule's unvested amount is
       * greater than `uprocessed`
       * - removed otherwise
       * (after each iteration `unprocessed` is reduced by the amount of unvested tokens
       * burned during that iteration)
       * - if the account has any `split_staking_status`, the `split_staking_status.amount`
       * is reduced by `min(amount, split_staking_status.amount)`
       * - `account.amount` is reduced by `amount`
       * - token supply is reduced by `amount`
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - `O(1)` - doesn't depend on the state or parameters
       * # </weight>
       **/
      burn: AugmentedSubmittable<(tokenId: u64 | AnyNumber | Uint8Array, memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u128]>;
      /**
       * Allow any user to remove an account
       * 
       * Preconditions:
       * - token by `token_id` must exist
       * - an account must exist for `token_id` x `member_id`
       * - if Permissioned token: `origin` signer must be `member_id` member's
       * controller account
       * - `token_id` x `member_id` account must be an empty account
       * (`account_data.amount` == 0)
       * Postconditions:
       * - Account information for `token_id` x `member_id` removed from storage
       * - bloat bond refunded to `member_id` controller account
       * (or `bloat_bond.repayment_restricted_to` account)
       * 
       * <weight>
       * 
       * `O (1)`
       * - DB:
       * - `O(1)` - doesn't depend on the state or parameters
       * # </weight>
       **/
      dustAccount: AugmentedSubmittable<(tokenId: u64 | AnyNumber | Uint8Array, memberId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Split-participating user leaves revenue split
       * Preconditions
       * - `token` must exist for `token_id`
       * - `origin` signer must be `member_id` member controller account
       * - `account` must exist for `(token_id, member_id)`
       * - `account.staking status.is_some()'
       * - if `(account.staking_status.split_id == token.next_revenue_split_id - 1`
       * AND `token.revenue_split` is active) THEN split staking period  must be ended
       * 
       * Postconditions
       * - `account.staking_status` set to None
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - `O(1)` - doesn't depend on the state or parameters
       * # </weight>
       **/
      exitRevenueSplit: AugmentedSubmittable<(tokenId: u64 | AnyNumber | Uint8Array, memberId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Join whitelist for permissioned case: used to add accounts for token
       * Preconditions:
       * - 'token_id' must be valid
       * - `origin` signer must be a controller account of `member_id`
       * - account for `member_id` must not already exist
       * - transfer policy is `Permissioned` and merkle proof must be valid
       * 
       * Postconditions:
       * - account for `member_id` created and added to pallet storage
       * - `bloat_bond` transferred from sender to treasury account
       * 
       * <weight>
       * 
       * ## Weight
       * `O (H)` where:
       * - `H` is the length of `proof.0`
       * - DB:
       * - `O(1)` - doesn't depend on the state or parameters
       * # </weight>
       **/
      joinWhitelist: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, tokenId: u64 | AnyNumber | Uint8Array, proof: PalletProjectTokenMerkleProof) => SubmittableExtrinsic<ApiType>, [u64, u64, PalletProjectTokenMerkleProof]>;
      /**
       * Participate in the *latest* token revenue split (if ongoing)
       * Preconditions:
       * - `token` must exist for `token_id`
       * - `origin` signer must be `member_id` member controller account
       * - `amount` must be > 0
       * - `account` must exist  for `(token_id, member_id)`
       * - `token.split_status` must be active AND THEN current_block in
       * [split.start, split.start + split_duration)
       * - `account.staking_status.is_none()` OR `account.staking_status.split_id` refers to a past split
       * - `account.amount` >= `amount`
       * - let `dividend = split_allocation * account.staked_amount / token.supply``
       * then `treasury` must be able to transfer `dividend` amount of JOY.
       * (This condition technically, should always be satisfied)
       * 
       * Postconditions
       * - `dividend` amount of JOYs transferred from `treasury_account` to `sender`
       * - `token` revenue split dividends payed tracking variable increased by `dividend`
       * - `account.staking_status` set to Some(..) with `amount` and `token.latest_split`
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - `O(1)` - doesn't depend on the state or parameters
       * # </weight>
       **/
      participateInSplit: AugmentedSubmittable<(tokenId: u64 | AnyNumber | Uint8Array, memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u128]>;
      /**
       * Purchase tokens on active token sale.
       * 
       * Preconditions:
       * - token by `token_id` must exist
       * - token by `token_id` must be in OfferingState::Sale
       * - `amount` cannot exceed number of tokens remaining on sale
       * - `origin` signer must be controller account of `member_id` member
       * - sender's available JOY balance must be:
       * - >= `joy_existential_deposit + amount * sale.unit_price`
       * if AccountData already exist
       * - >= `joy_existential_deposit + amount * sale.unit_price + bloat_bond`
       * if AccountData does not exist
       * - let `fee_amount` be `sale_platform_fee.mul_floor(amount * sale.unit_price)`
       * - if `sale.earnings_destination.is_some()` and `sale.earnings_destination` account has
       * zero balance:
       * - the amount to be transferred from `sender` to `sale.earnings_destination`,
       * which is equal to `amount * sale.unit_price - fee_amount`, must be greater than
       * `joy_existential_deposit`
       * - total number of tokens already purchased by the member on the current sale
       * PLUS `amount` must not exceed sale's purchase cap per member
       * - if Permissioned token:
       * - AccountInfoByTokenAndMember(token_id, &member_id) must exist
       * - if `sale.vesting_schedule.is_some()`:
       * - number of sender account's ongoing vesting schedules
       * must be < MaxVestingSchedulesPerAccountPerToken
       * 
       * Postconditions:
       * - if `sale.earnings_destination.is_some()`:
       * - `amount * sale.unit_price - fee_amount` JOY tokens are transfered from `sender`
       * to `sale.earnings_destination`
       * - `fee_amount` JOY is slashed from `sender` balance
       * - if `sale.earnings_destination.is_none()`:
       * - `amount * sale.unit_price` JOY is slashed from `sender` balance
       * - if new token account created: `bloat_bond` transferred from `sender` to treasury
       * - if `sale.vesting_schedule.is_some()`:
       * - if buyer has no `vesting_schedule` related to the current sale:
       * - a new vesting schedule (`sale.get_vesting_schedule(purchase_amount)`) is added to
       * buyer's `vesing_schedules`
       * - some finished vesting schedule is removed from buyer's account_data in case the
       * number of buyer's vesting_schedules was == MaxVestingSchedulesPerAccountPerToken
       * - if buyer already has a `vesting_schedule` related to the current sale:
       * - current vesting schedule's `cliff_amount` is increased by
       * `sale.get_vesting_schedule(purchase_amount).cliff_amount`
       * - current vesting schedule's `post_cliff_total_amount` is increased by
       * `sale.get_vesting_schedule(purchase_amount).post_cliff_total_amount`
       * - if `sale.vesting_schedule.is_none()`:
       * - buyer's account token amount increased by `amount`
       * - if `token_data.sale.quantity_left - amount == 0` and `sale.auto_finalize` is `true`
       * `token_data.sale` is set to None, otherwise `token_data.sale.quantity_left` is
       * decreased by `amount` and `token_data.sale.funds_collected` in increased by
       * `amount * sale.unit_price`
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - `O(1)` - doesn't depend on the state or parameters
       * # </weight>
       **/
      purchaseTokensOnSale: AugmentedSubmittable<(tokenId: u64 | AnyNumber | Uint8Array, memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u128]>;
      /**
       * Allow to transfer from `src_member_id` account to the various `outputs` beneficiaries
       * in the specified amounts.
       * 
       * Preconditions:
       * - origin signer must be `src_member_id` controller account
       * - token by `token_id` must exists
       * - account of `src_member_id` must exist for `token_id`
       * - sender must have enough JOYs to cover the total bloat bond required in case of
       * destination(s) not existing.
       * - source account must have enough token funds to cover all the transfer(s)
       * - `outputs` must designate existing destination(s) for "Permissioned" transfers.
       * Postconditions:
       * - source account's tokens amount is decreased by `amount`.
       * - total bloat bond transferred from sender's JOY balance into the treasury account
       * in case destination(s) have been added to storage
       * - `outputs.beneficiary` tokens amount increased by `amount`
       * 
       * <weight>
       * 
       * ## Weight
       * `O (T + M)` where:
       * - `T` is the length of `outputs`
       * - `M` is the size of `metadata` in kilobytes
       * - DB:
       * - `O(T)` - from the the generated weights
       * # </weight>
       **/
      transfer: AugmentedSubmittable<(srcMemberId: u64 | AnyNumber | Uint8Array, tokenId: u64 | AnyNumber | Uint8Array, outputs: PalletProjectTokenTransfersPayment, metadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, PalletProjectTokenTransfersPayment, Bytes]>;
    };
    proposalsCodex: {
      /**
       * Create a proposal, the type of proposal depends on the `proposal_details` variant
       * 
       * <weight>
       * 
       * ## Weight
       * `O (T + D + I)` where:
       * - `T` is the title size in kilobytes
       * - `D` is the description size in kilobytes
       * - `I` is the size of any parameter in `proposal_details`
       * (in kilobytes if it's metadata)
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createProposal: AugmentedSubmittable<(generalProposalParameters: PalletProposalsCodexGeneralProposalParams | { memberId?: any; title?: any; description?: any; stakingAccountId?: any; exactExecutionBlock?: any } | string | Uint8Array, proposalDetails: PalletProposalsCodexProposalDetails | { Signal: any } | { RuntimeUpgrade: any } | { FundingRequest: any } | { SetMaxValidatorCount: any } | { CreateWorkingGroupLeadOpening: any } | { FillWorkingGroupLeadOpening: any } | { UpdateWorkingGroupBudget: any } | { DecreaseWorkingGroupLeadStake: any } | { SlashWorkingGroupLead: any } | { SetWorkingGroupLeadReward: any } | { TerminateWorkingGroupLead: any } | { AmendConstitution: any } | { CancelWorkingGroupLeadOpening: any } | { SetMembershipPrice: any } | { SetCouncilBudgetIncrement: any } | { SetCouncilorReward: any } | { SetInitialInvitationBalance: any } | { SetInitialInvitationCount: any } | { SetMembershipLeadInvitationQuota: any } | { SetReferralCut: any } | { VetoProposal: any } | { UpdateGlobalNftLimit: any } | { UpdateChannelPayouts: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletProposalsCodexGeneralProposalParams, PalletProposalsCodexProposalDetails]>;
    };
    proposalsDiscussion: {
      /**
       * Adds a post with author origin check.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (L)` where:
       * - `L` is the size of `text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addPost: AugmentedSubmittable<(postAuthorId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array, editable: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, Bytes, bool]>;
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
      changeThreadMode: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, mode: PalletProposalsDiscussionThreadModeBTreeSet | { Open: any } | { Closed: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, PalletProposalsDiscussionThreadModeBTreeSet]>;
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
      deletePost: AugmentedSubmittable<(deleterId: u64 | AnyNumber | Uint8Array, postId: u64 | AnyNumber | Uint8Array, threadId: u64 | AnyNumber | Uint8Array, hide: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64, bool]>;
      /**
       * Updates a post with author origin check. Update attempts number is limited.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (L)` where:
       * - `L` is the size of `text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updatePost: AugmentedSubmittable<(threadId: u64 | AnyNumber | Uint8Array, postId: u64 | AnyNumber | Uint8Array, text: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, Bytes]>;
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
      cancelProposal: AugmentedSubmittable<(proposerId: u64 | AnyNumber | Uint8Array, proposalId: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u32]>;
      /**
       * Proposer Remark
       * 
       * <weight>
       * 
       * ## Weight
       * `O (1)` doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      proposerRemark: AugmentedSubmittable<(proposalId: u32 | AnyNumber | Uint8Array, proposerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, u64, Bytes]>;
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
      vetoProposal: AugmentedSubmittable<(proposalId: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
      /**
       * Vote extrinsic. Conditions:  origin must allow votes.
       * 
       * <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or paraemters
       * # </weight>
       **/
      vote: AugmentedSubmittable<(voterId: u64 | AnyNumber | Uint8Array, proposalId: u32 | AnyNumber | Uint8Array, vote: PalletProposalsEngineVoteKind | 'Approve' | 'Reject' | 'Slash' | 'Abstain' | number | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u32, PalletProposalsEngineVoteKind, Bytes]>;
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
      revealVote: AugmentedSubmittable<(salt: Bytes | string | Uint8Array, voteOptionId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, u64]>;
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
      vote: AugmentedSubmittable<(commitment: H256 | string | Uint8Array, stake: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [H256, u128]>;
    };
    session: {
      /**
       * Removes any session key(s) of the function caller.
       * 
       * This doesn't take effect until the next session.
       * 
       * The dispatch origin of this function must be Signed and the account must be either be
       * convertible to a validator ID using the chain's typical addressing system (this usually
       * means being a controller account) or directly convertible into a validator ID (which
       * usually means being a stash account).
       * 
       * # <weight>
       * - Complexity: `O(1)` in number of key types. Actual cost depends on the number of length
       * of `T::Keys::key_ids()` which is fixed.
       * - DbReads: `T::ValidatorIdOf`, `NextKeys`, `origin account`
       * - DbWrites: `NextKeys`, `origin account`
       * - DbWrites per key id: `KeyOwner`
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
       * - Complexity: `O(1)`. Actual cost depends on the number of length of
       * `T::Keys::key_ids()` which is fixed.
       * - DbReads: `origin account`, `T::ValidatorIdOf`, `NextKeys`
       * - DbWrites: `origin account`, `NextKeys`
       * - DbReads per key id: `KeyOwner`
       * - DbWrites per key id: `KeyOwner`
       * # </weight>
       **/
      setKeys: AugmentedSubmittable<(keys: JoystreamNodeRuntimeSessionKeys | { grandpa?: any; babe?: any; imOnline?: any; authorityDiscovery?: any } | string | Uint8Array, proof: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [JoystreamNodeRuntimeSessionKeys, Bytes]>;
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
       * # <weight>
       * - Independent of the arguments. Moderate complexity.
       * - O(1).
       * - Three extra DB entries.
       * 
       * NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned
       * unless the `origin` falls below _existential deposit_ and gets removed as dust.
       * ------------------
       * # </weight>
       **/
      bond: AugmentedSubmittable<(controller: AccountId32 | string | Uint8Array, value: Compact<u128> | AnyNumber | Uint8Array, payee: PalletStakingRewardDestination | { Staked: any } | { Stash: any } | { Controller: any } | { Account: any } | { None: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, Compact<u128>, PalletStakingRewardDestination]>;
      /**
       * Add some extra amount that have appeared in the stash `free_balance` into the balance up
       * for staking.
       * 
       * The dispatch origin for this call must be _Signed_ by the stash, not the controller.
       * 
       * Use this if there are additional funds in your stash account that you wish to bond.
       * Unlike [`bond`](Self::bond) or [`unbond`](Self::unbond) this function does not impose
       * any limitation on the amount that can be added.
       * 
       * Emits `Bonded`.
       * 
       * # <weight>
       * - Independent of the arguments. Insignificant complexity.
       * - O(1).
       * # </weight>
       **/
      bondExtra: AugmentedSubmittable<(maxAdditional: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u128>]>;
      /**
       * Cancel enactment of a deferred slash.
       * 
       * Can be called by the `T::SlashCancelOrigin`.
       * 
       * Parameters: era and indices of the slashes for that era to kill.
       **/
      cancelDeferredSlash: AugmentedSubmittable<(era: u32 | AnyNumber | Uint8Array, slashIndices: Vec<u32> | (u32 | AnyNumber | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [u32, Vec<u32>]>;
      /**
       * Declare no desire to either validate or nominate.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * 
       * # <weight>
       * - Independent of the arguments. Insignificant complexity.
       * - Contains one read.
       * - Writes are limited to the `origin` account key.
       * # </weight>
       **/
      chill: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Declare a `controller` to stop participating as either a validator or nominator.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_, but can be called by anyone.
       * 
       * If the caller is the same as the controller being targeted, then no further checks are
       * enforced, and this function behaves just like `chill`.
       * 
       * If the caller is different than the controller being targeted, the following conditions
       * must be met:
       * 
       * * `controller` must belong to a nominator who has become non-decodable,
       * 
       * Or:
       * 
       * * A `ChillThreshold` must be set and checked which defines how close to the max
       * nominators or validators we must reach before users can start chilling one-another.
       * * A `MaxNominatorCount` and `MaxValidatorCount` must be set which is used to determine
       * how close we are to the threshold.
       * * A `MinNominatorBond` and `MinValidatorBond` must be set and checked, which determines
       * if this is a person that should be chilled because they have not met the threshold
       * bond required.
       * 
       * This can be helpful if bond requirements are updated, and we need to remove old users
       * who do not satisfy these requirements.
       **/
      chillOther: AugmentedSubmittable<(controller: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      /**
       * Force a validator to have at least the minimum commission. This will not affect a
       * validator who already has a commission greater than or equal to the minimum. Any account
       * can call this.
       **/
      forceApplyMinCommission: AugmentedSubmittable<(validatorStash: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      /**
       * Force there to be a new era at the end of the next session. After this, it will be
       * reset to normal (non-forced) behaviour.
       * 
       * The dispatch origin must be Root.
       * 
       * # Warning
       * 
       * The election process starts multiple blocks before the end of the era.
       * If this is called just before a new era is triggered, the election process may not
       * have enough blocks to get a result.
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
       * # Warning
       * 
       * The election process starts multiple blocks before the end of the era.
       * If this is called just before a new era is triggered, the election process may not
       * have enough blocks to get a result.
       **/
      forceNewEraAlways: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Force there to be no new eras indefinitely.
       * 
       * The dispatch origin must be Root.
       * 
       * # Warning
       * 
       * The election process starts multiple blocks before the end of the era.
       * Thus the election process may be ongoing when this is called. In this case the
       * election will continue until the next era is triggered.
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
       **/
      forceUnstake: AugmentedSubmittable<(stash: AccountId32 | string | Uint8Array, numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u32]>;
      /**
       * Increments the ideal number of validators.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Same as [`Self::set_validator_count`].
       * # </weight>
       **/
      increaseValidatorCount: AugmentedSubmittable<(additional: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u32>]>;
      /**
       * Remove the given nominations from the calling validator.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * 
       * - `who`: A list of nominator stash accounts who are nominating this validator which
       * should no longer be nominating this validator.
       * 
       * Note: Making this call only makes sense if you first set the validator preferences to
       * block any further nominations.
       **/
      kick: AugmentedSubmittable<(who: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>]>;
      /**
       * Declare the desire to nominate `targets` for the origin controller.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * 
       * # <weight>
       * - The transaction's complexity is proportional to the size of `targets` (N)
       * which is capped at CompactAssignments::LIMIT (T::MaxNominations).
       * - Both the reads and writes follow a similar pattern.
       * # </weight>
       **/
      nominate: AugmentedSubmittable<(targets: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>]>;
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
       * # <weight>
       * - Time complexity: at most O(MaxNominatorRewardedPerValidator).
       * - Contains a limited number of reads and writes.
       * -----------
       * N is the Number of payouts for the validator (including the validator)
       * Weight:
       * - Reward Destination Staked: O(N)
       * - Reward Destination Controller (Creating): O(N)
       * 
       * NOTE: weights are assuming that payouts are made to alive stash account (Staked).
       * Paying even a dead controller is cheaper weight-wise. We don't do any refunds here.
       * # </weight>
       **/
      payoutStakers: AugmentedSubmittable<(validatorStash: AccountId32 | string | Uint8Array, era: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u32]>;
      /**
       * Remove all data structures concerning a staker/stash once it is at a state where it can
       * be considered `dust` in the staking system. The requirements are:
       * 
       * 1. the `total_balance` of the stash is below existential deposit.
       * 2. or, the `ledger.total` of the stash is below existential deposit.
       * 
       * The former can happen in cases like a slash; the latter when a fully unbonded account
       * is still receiving staking rewards in `RewardDestination::Staked`.
       * 
       * It can be called by anyone, as long as `stash` meets the above requirements.
       * 
       * Refunds the transaction fees upon successful execution.
       **/
      reapStash: AugmentedSubmittable<(stash: AccountId32 | string | Uint8Array, numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u32]>;
      /**
       * Rebond a portion of the stash scheduled to be unlocked.
       * 
       * The dispatch origin must be signed by the controller.
       * 
       * # <weight>
       * - Time complexity: O(L), where L is unlocking chunks
       * - Bounded by `MaxUnlockingChunks`.
       * - Storage changes: Can't increase storage, only decrease it.
       * # </weight>
       **/
      rebond: AugmentedSubmittable<(value: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u128>]>;
      /**
       * Scale up the ideal number of validators by a factor.
       * 
       * The dispatch origin must be Root.
       * 
       * # <weight>
       * Same as [`Self::set_validator_count`].
       * # </weight>
       **/
      scaleValidatorCount: AugmentedSubmittable<(factor: Percent | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Percent]>;
      /**
       * (Re-)set the controller of a stash.
       * 
       * Effects will be felt instantly (as soon as this function is completed successfully).
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
      setController: AugmentedSubmittable<(controller: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      /**
       * Set `HistoryDepth` value. This function will delete any history information
       * when `HistoryDepth` is reduced.
       * 
       * Parameters:
       * - `new_history_depth`: The new history depth you would like to set.
       * - `era_items_deleted`: The number of items that will be deleted by this dispatch. This
       * should report all the storage items that will be deleted by clearing old era history.
       * Needed to report an accurate weight for the dispatch. Trusted by `Root` to report an
       * accurate number.
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
       * - Writes Each: ErasValidatorReward, ErasRewardPoints, ErasTotalStake,
       * ErasStartSessionIndex
       * # </weight>
       **/
      setHistoryDepth: AugmentedSubmittable<(newHistoryDepth: Compact<u32> | AnyNumber | Uint8Array, eraItemsDeleted: Compact<u32> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u32>, Compact<u32>]>;
      /**
       * Set the validators who cannot be slashed (if any).
       * 
       * The dispatch origin must be Root.
       **/
      setInvulnerables: AugmentedSubmittable<(invulnerables: Vec<AccountId32> | (AccountId32 | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<AccountId32>]>;
      /**
       * (Re-)set the payment target for a controller.
       * 
       * Effects will be felt instantly (as soon as this function is completed successfully).
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
      setPayee: AugmentedSubmittable<(payee: PalletStakingRewardDestination | { Staked: any } | { Stash: any } | { Controller: any } | { Account: any } | { None: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStakingRewardDestination]>;
      /**
       * Update the various staking configurations .
       * 
       * * `min_nominator_bond`: The minimum active bond needed to be a nominator.
       * * `min_validator_bond`: The minimum active bond needed to be a validator.
       * * `max_nominator_count`: The max number of users who can be a nominator at once. When
       * set to `None`, no limit is enforced.
       * * `max_validator_count`: The max number of users who can be a validator at once. When
       * set to `None`, no limit is enforced.
       * * `chill_threshold`: The ratio of `max_nominator_count` or `max_validator_count` which
       * should be filled in order for the `chill_other` transaction to work.
       * * `min_commission`: The minimum amount of commission that each validators must maintain.
       * This is checked only upon calling `validate`. Existing validators are not affected.
       * 
       * Origin must be Root to call this function.
       * 
       * NOTE: Existing nominators and validators will not be affected by this update.
       * to kick people under the new limits, `chill_other` should be called.
       **/
      setStakingConfigs: AugmentedSubmittable<(minNominatorBond: PalletStakingPalletConfigOpU128 | { Noop: any } | { Set: any } | { Remove: any } | string | Uint8Array, minValidatorBond: PalletStakingPalletConfigOpU128 | { Noop: any } | { Set: any } | { Remove: any } | string | Uint8Array, maxNominatorCount: PalletStakingPalletConfigOpU32 | { Noop: any } | { Set: any } | { Remove: any } | string | Uint8Array, maxValidatorCount: PalletStakingPalletConfigOpU32 | { Noop: any } | { Set: any } | { Remove: any } | string | Uint8Array, chillThreshold: PalletStakingPalletConfigOpPercent | { Noop: any } | { Set: any } | { Remove: any } | string | Uint8Array, minCommission: PalletStakingPalletConfigOpPerbill | { Noop: any } | { Set: any } | { Remove: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStakingPalletConfigOpU128, PalletStakingPalletConfigOpU128, PalletStakingPalletConfigOpU32, PalletStakingPalletConfigOpU32, PalletStakingPalletConfigOpPercent, PalletStakingPalletConfigOpPerbill]>;
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
       * Schedule a portion of the stash to be unlocked ready for transfer out after the bond
       * period ends. If this leaves an amount actively bonded less than
       * T::Currency::minimum_balance(), then it is increased to the full amount.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       * 
       * Once the unlock period is done, you can call `withdraw_unbonded` to actually move
       * the funds out of management ready for transfer.
       * 
       * No more than a limited number of unlocking chunks (see `MaxUnlockingChunks`)
       * can co-exists at the same time. In that case, [`Call::withdraw_unbonded`] need
       * to be called first to remove some of the chunks (if possible).
       * 
       * If a user encounters the `InsufficientBond` error when calling this extrinsic,
       * they should call `chill` first in order to free up their bonded funds.
       * 
       * Emits `Unbonded`.
       * 
       * See also [`Call::withdraw_unbonded`].
       **/
      unbond: AugmentedSubmittable<(value: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u128>]>;
      /**
       * Declare the desire to validate for the origin controller.
       * 
       * Effects will be felt at the beginning of the next era.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
       **/
      validate: AugmentedSubmittable<(prefs: PalletStakingValidatorPrefs | { commission?: any; blocked?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStakingValidatorPrefs]>;
      /**
       * Remove any unlocked chunks from the `unlocking` queue from our management.
       * 
       * This essentially frees up that balance to be used by the stash account to do
       * whatever it wants.
       * 
       * The dispatch origin for this call must be _Signed_ by the controller.
       * 
       * Emits `Withdrawn`.
       * 
       * See also [`Call::unbond`].
       * 
       * # <weight>
       * Complexity O(S) where S is the number of slashing spans to remove
       * NOTE: Weight annotation is the kill scenario, we refund otherwise.
       * # </weight>
       **/
      withdrawUnbonded: AugmentedSubmittable<(numSlashingSpans: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
    };
    storage: {
      /**
       * Accept pending invite.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      acceptDistributionBucketInvitation: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletStorageDistributionBucketIdRecord]>;
      /**
       * A storage provider signals that the data object was successfully uploaded to its storage.
       * <weight>
       * 
       * ## Weight
       * `O (W )` where:
       * - `W` is the number of items in `data_objects`
       * - DB:
       * - `O(W)` - from the the generated weights
       * # </weight>
       **/
      acceptPendingDataObjects: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, storageBucketId: u64 | AnyNumber | Uint8Array, bagId: PalletStorageBagIdType | { Static: any } | { Dynamic: any } | string | Uint8Array, dataObjects: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, u64, PalletStorageBagIdType, BTreeSet<u64>]>;
      /**
       * Accept the storage bucket invitation. An invitation must match the worker_id parameter.
       * It accepts an additional account ID (transactor) for accepting data objects to prevent
       * transaction nonce collisions.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      acceptStorageBucketInvitation: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, storageBucketId: u64 | AnyNumber | Uint8Array, transactorAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, AccountId32]>;
      /**
       * Cancel pending invite. Must be pending.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelDistributionBucketOperatorInvite: AugmentedSubmittable<(bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array, operatorWorkerId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageDistributionBucketIdRecord, u64]>;
      /**
       * Cancel pending storage bucket invite. An invitation must be pending.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      cancelStorageBucketOperatorInvite: AugmentedSubmittable<(storageBucketId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Create a distribution bucket.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createDistributionBucket: AugmentedSubmittable<(familyId: u64 | AnyNumber | Uint8Array, acceptingNewBags: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, bool]>;
      /**
       * Create a distribution bucket family.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createDistributionBucketFamily: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Create storage bucket.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      createStorageBucket: AugmentedSubmittable<(inviteWorker: Option<u64> | null | object | string | Uint8Array, acceptingNewBags: bool | boolean | Uint8Array, sizeLimit: u64 | AnyNumber | Uint8Array, objectsLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Option<u64>, bool, u64, u64]>;
      /**
       * Delete distribution bucket. Must be empty.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      deleteDistributionBucket: AugmentedSubmittable<(bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageDistributionBucketIdRecord]>;
      /**
       * Deletes a distribution bucket family.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      deleteDistributionBucketFamily: AugmentedSubmittable<(familyId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Delete storage bucket. Must be empty. Storage operator must be missing.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      deleteStorageBucket: AugmentedSubmittable<(storageBucketId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Create a dynamic bag. Development mode.
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is size of `message` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      distributionOperatorRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, distributionBucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletStorageDistributionBucketIdRecord, Bytes]>;
      /**
       * Invite an operator. Must be missing.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      inviteDistributionBucketOperator: AugmentedSubmittable<(bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array, operatorWorkerId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageDistributionBucketIdRecord, u64]>;
      /**
       * Invite storage bucket operator. Must be missing.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      inviteStorageBucketOperator: AugmentedSubmittable<(storageBucketId: u64 | AnyNumber | Uint8Array, operatorId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Removes distribution bucket operator.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      removeDistributionBucketOperator: AugmentedSubmittable<(bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array, operatorWorkerId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageDistributionBucketIdRecord, u64]>;
      /**
       * Removes storage bucket operator.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      removeStorageBucketOperator: AugmentedSubmittable<(storageBucketId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Set distribution bucket family metadata.
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is size of `metadata` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setDistributionBucketFamilyMetadata: AugmentedSubmittable<(familyId: u64 | AnyNumber | Uint8Array, metadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
      /**
       * Set distribution operator metadata for the distribution bucket.
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is size of `metadata` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setDistributionOperatorMetadata: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array, metadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, PalletStorageDistributionBucketIdRecord, Bytes]>;
      /**
       * Sets storage bucket voucher limits.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStorageBucketVoucherLimits: AugmentedSubmittable<(storageBucketId: u64 | AnyNumber | Uint8Array, newObjectsSizeLimit: u64 | AnyNumber | Uint8Array, newObjectsNumberLimit: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, u64]>;
      /**
       * Sets storage operator metadata (eg.: storage node URL).
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is size of `metadata` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      setStorageOperatorMetadata: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, storageBucketId: u64 | AnyNumber | Uint8Array, metadata: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, Bytes]>;
      /**
       * Create a dynamic bag. Development mode.
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is size of `message` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      storageOperatorRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, storageBucketId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64, Bytes]>;
      /**
       * Upload new data objects. Development mode.
       **/
      sudoUploadDataObjects: AugmentedSubmittable<(params: PalletStorageUploadParametersRecord | { bagId?: any; objectCreationList?: any; stateBloatBondSourceAccountId?: any; expectedDataSizeFee?: any; expectedDataObjectStateBloatBond?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageUploadParametersRecord]>;
      /**
       * Add and remove hashes to the current blacklist.
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the number of items in `remove_hashes`
       * - `V` is the number of items in `add_hashes`
       * - DB:
       * - `O(W)` - from the the generated weights
       * # </weight>
       **/
      updateBlacklist: AugmentedSubmittable<(removeHashes: BTreeSet<Bytes>, addHashes: BTreeSet<Bytes>) => SubmittableExtrinsic<ApiType>, [BTreeSet<Bytes>, BTreeSet<Bytes>]>;
      /**
       * Updates data object state bloat bond value.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateDataObjectStateBloatBond: AugmentedSubmittable<(stateBloatBond: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Updates size-based pricing of new objects uploaded.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateDataSizeFee: AugmentedSubmittable<(newDataSizeFee: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Updates 'distributing' flag for the distributing flag.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateDistributionBucketMode: AugmentedSubmittable<(bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array, distributing: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageDistributionBucketIdRecord, bool]>;
      /**
       * Updates distribution buckets for a bag.
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the number of items in `add_buckets_indices`
       * - `V` is the number of items in `remove_buckets_indices`
       * - DB:
       * - `O(V + W)` - from the the generated weights
       * # </weight>
       **/
      updateDistributionBucketsForBag: AugmentedSubmittable<(bagId: PalletStorageBagIdType | { Static: any } | { Dynamic: any } | string | Uint8Array, familyId: u64 | AnyNumber | Uint8Array, addBucketsIndices: BTreeSet<u64>, removeBucketsIndices: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [PalletStorageBagIdType, u64, BTreeSet<u64>, BTreeSet<u64>]>;
      /**
       * Updates "Distribution buckets per bag" number limit.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateDistributionBucketsPerBagLimit: AugmentedSubmittable<(newLimit: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
      /**
       * Updates a distribution bucket 'accepts new bags' flag.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateDistributionBucketStatus: AugmentedSubmittable<(bucketId: PalletStorageDistributionBucketIdRecord | { distributionBucketFamilyId?: any; distributionBucketIndex?: any } | string | Uint8Array, acceptingNewBags: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageDistributionBucketIdRecord, bool]>;
      /**
       * Update number of distributed buckets used in given dynamic bag creation policy.
       * Updates distribution buckets for a bag.
       * <weight>
       * 
       * ## Weight
       * `O (W)` where:
       * - `W` is the number of items in `families`
       * - DB:
       * - `O(W)` - from the the generated weights
       * # </weight>
       **/
      updateFamiliesInDynamicBagCreationPolicy: AugmentedSubmittable<(dynamicBagType: PalletStorageDynamicBagType | 'Member' | 'Channel' | number | Uint8Array, families: BTreeMap<u64, u32>) => SubmittableExtrinsic<ApiType>, [PalletStorageDynamicBagType, BTreeMap<u64, u32>]>;
      /**
       * Update number of storage buckets used in given dynamic bag creation policy.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateNumberOfStorageBucketsInDynamicBagCreationPolicy: AugmentedSubmittable<(dynamicBagType: PalletStorageDynamicBagType | 'Member' | 'Channel' | number | Uint8Array, numberOfStorageBuckets: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletStorageDynamicBagType, u32]>;
      /**
       * Updates storage buckets for a bag.
       * <weight>
       * 
       * ## Weight
       * `O (W + V)` where:
       * - `W` is the number of items in `add_buckets`
       * - `V` is the number of items in `remove_buckets`
       * - DB:
       * - `O(V + W)` - from the the generated weights
       * # </weight>
       **/
      updateStorageBucketsForBag: AugmentedSubmittable<(bagId: PalletStorageBagIdType | { Static: any } | { Dynamic: any } | string | Uint8Array, addBuckets: BTreeSet<u64>, removeBuckets: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [PalletStorageBagIdType, BTreeSet<u64>, BTreeSet<u64>]>;
      /**
       * Updates "Storage buckets per bag" number limit.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateStorageBucketsPerBagLimit: AugmentedSubmittable<(newLimit: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
      /**
       * Update whether new bags are being accepted for storage.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateStorageBucketStatus: AugmentedSubmittable<(storageBucketId: u64 | AnyNumber | Uint8Array, acceptingNewBags: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, bool]>;
      /**
       * Updates "Storage buckets voucher max limits".
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateStorageBucketsVoucherMaxLimits: AugmentedSubmittable<(newObjectsSize: u64 | AnyNumber | Uint8Array, newObjectsNumber: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u64]>;
      /**
       * Updates global uploading flag.
       * <weight>
       * 
       * ## Weight
       * `O (1)`
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      updateUploadingBlockedStatus: AugmentedSubmittable<(newStatus: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [bool]>;
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
       * - `D` is the size of `description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      addOpening: AugmentedSubmittable<(description: Bytes | string | Uint8Array, openingType: PalletWorkingGroupOpeningType | 'Leader' | 'Regular' | number | Uint8Array, stakePolicy: PalletWorkingGroupStakePolicy | { stakeAmount?: any; leavingUnstakingPeriod?: any } | string | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Apply on a worker opening.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (D)` where:
       * - `D` is the size of `p.description` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      applyOnOpening: AugmentedSubmittable<(p: PalletWorkingGroupApplyOnOpeningParams | { memberId?: any; openingId?: any; roleAccountId?: any; rewardAccountId?: any; description?: any; stakeParameters?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [PalletWorkingGroupApplyOnOpeningParams]>;
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
      cancelOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
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
      decreaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
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
      fillOpening: AugmentedSubmittable<(openingId: u64 | AnyNumber | Uint8Array, successfulApplicationIds: BTreeSet<u64>) => SubmittableExtrinsic<ApiType>, [u64, BTreeSet<u64>]>;
      /**
       * Fund working group budget by a member.
       * <weight>
       * 
       * ## Weight
       * `O (1)` Doesn't depend on the state or parameters
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      fundWorkingGroupBudget: AugmentedSubmittable<(memberId: u64 | AnyNumber | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Bytes]>;
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
      increaseStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, stakeBalanceDelta: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128]>;
      /**
       * Lead remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leadRemark: AugmentedSubmittable<(msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Leave the role by the active worker.
       * # <weight>
       * 
       * ## Weight
       * `O (R)` where:
       * - `R` is the size of `rationale` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      leaveRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<Bytes>]>;
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
      setBudget: AugmentedSubmittable<(newBudget: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128]>;
      /**
       * Sets a new status text for the working group.
       * Requires root origin.
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (S)` where:
       * - `S` is the size of the contents of `status_text` in kilobytes when it is not none
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
       * - `P` is the size of `penality.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      slashStake: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, u128, Option<Bytes>]>;
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
      spendFromBudget: AugmentedSubmittable<(accountId: AccountId32 | string | Uint8Array, amount: u128 | AnyNumber | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Terminate the active worker by the lead.
       * Requires signed leader origin or the root (to terminate the leader role).
       * # <weight>
       * 
       * ## Weight
       * `O (P)` where:
       * - `P` is the size `penalty.slashing_text` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      terminateRole: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, penalty: Option<u128> | null | object | string | Uint8Array, rationale: Option<Bytes> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>, Option<Bytes>]>;
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
      updateRewardAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRewardAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      updateRewardAmount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, rewardPerBlock: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Option<u128>]>;
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
      updateRoleAccount: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, newRoleAccountId: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, AccountId32]>;
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
      withdrawApplication: AugmentedSubmittable<(applicationId: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Worker remark message
       * 
       * # <weight>
       * 
       * ## Weight
       * `O (M)` where:
       * - `M` is the size of `msg` in kilobytes
       * - DB:
       * - O(1) doesn't depend on the state or parameters
       * # </weight>
       **/
      workerRemark: AugmentedSubmittable<(workerId: u64 | AnyNumber | Uint8Array, msg: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64, Bytes]>;
    };
    sudo: {
      /**
       * Authenticates the current sudo key and sets the given AccountId (`new`) as the new sudo
       * key.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * # <weight>
       * - O(1).
       * - Limited storage reads.
       * - One DB change.
       * # </weight>
       **/
      setKey: AugmentedSubmittable<(updated: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
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
      sudo: AugmentedSubmittable<(call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Call]>;
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
      sudoAs: AugmentedSubmittable<(who: AccountId32 | string | Uint8Array, call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, Call]>;
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
      sudoUncheckedWeight: AugmentedSubmittable<(call: Call | IMethod | string | Uint8Array, weight: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Call, u64]>;
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
       **/
      killPrefix: AugmentedSubmittable<(prefix: Bytes | string | Uint8Array, subkeys: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, u32]>;
      /**
       * Kill some items from storage.
       **/
      killStorage: AugmentedSubmittable<(keys: Vec<Bytes> | (Bytes | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Bytes>]>;
      /**
       * Make some on-chain remark.
       * 
       * # <weight>
       * - `O(1)`
       * # </weight>
       **/
      remark: AugmentedSubmittable<(remark: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Make some on-chain remark and emit event.
       **/
      remarkWithEvent: AugmentedSubmittable<(remark: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Set the new runtime code.
       * 
       * # <weight>
       * - `O(C + S)` where `C` length of `code` and `S` complexity of `can_set_code`
       * - 1 call to `can_set_code`: `O(S)` (calls `sp_io::misc::runtime_version` which is
       * expensive).
       * - 1 storage write (codec `O(C)`).
       * - 1 digest item.
       * - 1 event.
       * The weight of this function is dependent on the runtime, but generally this is very
       * expensive. We will treat this as a full block.
       * # </weight>
       **/
      setCode: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Set the new runtime code without doing any checks of the given `code`.
       * 
       * # <weight>
       * - `O(C)` where `C` length of `code`
       * - 1 storage write (codec `O(C)`).
       * - 1 digest item.
       * - 1 event.
       * The weight of this function is dependent on the runtime. We will treat this as a full
       * block. # </weight>
       **/
      setCodeWithoutChecks: AugmentedSubmittable<(code: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Set the number of pages in the WebAssembly environment's heap.
       **/
      setHeapPages: AugmentedSubmittable<(pages: u64 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u64]>;
      /**
       * Set some items of storage.
       **/
      setStorage: AugmentedSubmittable<(items: Vec<ITuple<[Bytes, Bytes]>> | ([Bytes | string | Uint8Array, Bytes | string | Uint8Array])[]) => SubmittableExtrinsic<ApiType>, [Vec<ITuple<[Bytes, Bytes]>>]>;
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
       * - `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
       * - 1 storage read and 1 storage mutation (codec `O(1)`). (because of `DidUpdate::take` in
       * `on_finalize`)
       * - 1 event handler `on_timestamp_set`. Must be `O(1)`.
       * # </weight>
       **/
      set: AugmentedSubmittable<(now: Compact<u64> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Compact<u64>]>;
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
      asDerivative: AugmentedSubmittable<(index: u16 | AnyNumber | Uint8Array, call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16, Call]>;
      /**
       * Send a batch of dispatch calls.
       * 
       * May be called from any origin.
       * 
       * - `calls`: The calls to be dispatched from the same origin. The number of call must not
       * exceed the constant: `batched_calls_limit` (available in constant metadata).
       * 
       * If origin is root then call are dispatch without checking origin filter. (This includes
       * bypassing `frame_system::Config::BaseCallFilter`).
       * 
       * # <weight>
       * - Complexity: O(C) where C is the number of calls to be batched.
       * # </weight>
       * 
       * This will return `Ok` in all circumstances. To determine the success of the batch, an
       * event is deposited. If a call failed and the batch was interrupted, then the
       * `BatchInterrupted` event is deposited, along with the number of successful calls made
       * and the error of the failed call. If all were successful, then the `BatchCompleted`
       * event is deposited.
       **/
      batch: AugmentedSubmittable<(calls: Vec<Call> | (Call | IMethod | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Call>]>;
      /**
       * Send a batch of dispatch calls and atomically execute them.
       * The whole transaction will rollback and fail if any of the calls failed.
       * 
       * May be called from any origin.
       * 
       * - `calls`: The calls to be dispatched from the same origin. The number of call must not
       * exceed the constant: `batched_calls_limit` (available in constant metadata).
       * 
       * If origin is root then call are dispatch without checking origin filter. (This includes
       * bypassing `frame_system::Config::BaseCallFilter`).
       * 
       * # <weight>
       * - Complexity: O(C) where C is the number of calls to be batched.
       * # </weight>
       **/
      batchAll: AugmentedSubmittable<(calls: Vec<Call> | (Call | IMethod | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Call>]>;
      /**
       * Dispatches a function call with a provided origin.
       * 
       * The dispatch origin for this call must be _Root_.
       * 
       * # <weight>
       * - O(1).
       * - Limited storage reads.
       * - One DB write (event).
       * - Weight of derivative `call` execution + T::WeightInfo::dispatch_as().
       * # </weight>
       **/
      dispatchAs: AugmentedSubmittable<(asOrigin: JoystreamNodeRuntimeOriginCaller | { system: any } | { Void: any } | string | Uint8Array, call: Call | IMethod | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [JoystreamNodeRuntimeOriginCaller, Call]>;
      /**
       * Send a batch of dispatch calls.
       * Unlike `batch`, it allows errors and won't interrupt.
       * 
       * May be called from any origin.
       * 
       * - `calls`: The calls to be dispatched from the same origin. The number of call must not
       * exceed the constant: `batched_calls_limit` (available in constant metadata).
       * 
       * If origin is root then call are dispatch without checking origin filter. (This includes
       * bypassing `frame_system::Config::BaseCallFilter`).
       * 
       * # <weight>
       * - Complexity: O(C) where C is the number of calls to be batched.
       * # </weight>
       **/
      forceBatch: AugmentedSubmittable<(calls: Vec<Call> | (Call | IMethod | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<Call>]>;
    };
    vesting: {
      /**
       * Force a vested transfer.
       * 
       * The dispatch origin for this call must be _Root_.
       * 
       * - `source`: The account whose funds should be transferred.
       * - `target`: The account that should be transferred the vested funds.
       * - `schedule`: The vesting schedule attached to the transfer.
       * 
       * Emits `VestingCreated`.
       * 
       * NOTE: This will unlock all schedules through the current block.
       * 
       * # <weight>
       * - `O(1)`.
       * - DbWeight: 4 Reads, 4 Writes
       * - Reads: Vesting Storage, Balances Locks, Target Account, Source Account
       * - Writes: Vesting Storage, Balances Locks, Target Account, Source Account
       * # </weight>
       **/
      forceVestedTransfer: AugmentedSubmittable<(source: AccountId32 | string | Uint8Array, target: AccountId32 | string | Uint8Array, schedule: PalletVestingVestingInfo | { locked?: any; perBlock?: any; startingBlock?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, AccountId32, PalletVestingVestingInfo]>;
      /**
       * Merge two vesting schedules together, creating a new vesting schedule that unlocks over
       * the highest possible start and end blocks. If both schedules have already started the
       * current block will be used as the schedule start; with the caveat that if one schedule
       * is finished by the current block, the other will be treated as the new merged schedule,
       * unmodified.
       * 
       * NOTE: If `schedule1_index == schedule2_index` this is a no-op.
       * NOTE: This will unlock all schedules through the current block prior to merging.
       * NOTE: If both schedules have ended by the current block, no new schedule will be created
       * and both will be removed.
       * 
       * Merged schedule attributes:
       * - `starting_block`: `MAX(schedule1.starting_block, scheduled2.starting_block,
       * current_block)`.
       * - `ending_block`: `MAX(schedule1.ending_block, schedule2.ending_block)`.
       * - `locked`: `schedule1.locked_at(current_block) + schedule2.locked_at(current_block)`.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `schedule1_index`: index of the first schedule to merge.
       * - `schedule2_index`: index of the second schedule to merge.
       **/
      mergeSchedules: AugmentedSubmittable<(schedule1Index: u32 | AnyNumber | Uint8Array, schedule2Index: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, u32]>;
      /**
       * Unlock any vested funds of the sender account.
       * 
       * The dispatch origin for this call must be _Signed_ and the sender must have funds still
       * locked under this pallet.
       * 
       * Emits either `VestingCompleted` or `VestingUpdated`.
       * 
       * # <weight>
       * - `O(1)`.
       * - DbWeight: 2 Reads, 2 Writes
       * - Reads: Vesting Storage, Balances Locks, [Sender Account]
       * - Writes: Vesting Storage, Balances Locks, [Sender Account]
       * # </weight>
       **/
      vest: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Create a vested transfer.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `target`: The account receiving the vested funds.
       * - `schedule`: The vesting schedule attached to the transfer.
       * 
       * Emits `VestingCreated`.
       * 
       * NOTE: This will unlock all schedules through the current block.
       * 
       * # <weight>
       * - `O(1)`.
       * - DbWeight: 3 Reads, 3 Writes
       * - Reads: Vesting Storage, Balances Locks, Target Account, [Sender Account]
       * - Writes: Vesting Storage, Balances Locks, Target Account, [Sender Account]
       * # </weight>
       **/
      vestedTransfer: AugmentedSubmittable<(target: AccountId32 | string | Uint8Array, schedule: PalletVestingVestingInfo | { locked?: any; perBlock?: any; startingBlock?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, PalletVestingVestingInfo]>;
      /**
       * Unlock any vested funds of a `target` account.
       * 
       * The dispatch origin for this call must be _Signed_.
       * 
       * - `target`: The account whose vested funds should be unlocked. Must have funds still
       * locked under this pallet.
       * 
       * Emits either `VestingCompleted` or `VestingUpdated`.
       * 
       * # <weight>
       * - `O(1)`.
       * - DbWeight: 3 Reads, 3 Writes
       * - Reads: Vesting Storage, Balances Locks, Target Account
       * - Writes: Vesting Storage, Balances Locks, Target Account
       * # </weight>
       **/
      vestOther: AugmentedSubmittable<(target: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
    };
  } // AugmentedSubmittables
} // declare module
