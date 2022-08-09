// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

/* eslint-disable sort-keys */

export default {
  /**
   * Lookup3: frame_system::AccountInfo<Index, pallet_balances::AccountData<Balance>>
   **/
  FrameSystemAccountInfo: {
    nonce: 'u32',
    consumers: 'u32',
    providers: 'u32',
    sufficients: 'u32',
    data: 'PalletBalancesAccountData'
  },
  /**
   * Lookup5: pallet_balances::AccountData<Balance>
   **/
  PalletBalancesAccountData: {
    free: 'u128',
    reserved: 'u128',
    miscFrozen: 'u128',
    feeFrozen: 'u128'
  },
  /**
   * Lookup7: frame_support::weights::PerDispatchClass<T>
   **/
  FrameSupportWeightsPerDispatchClassU64: {
    normal: 'u64',
    operational: 'u64',
    mandatory: 'u64'
  },
  /**
   * Lookup11: sp_runtime::generic::digest::Digest
   **/
  SpRuntimeDigest: {
    logs: 'Vec<SpRuntimeDigestDigestItem>'
  },
  /**
   * Lookup13: sp_runtime::generic::digest::DigestItem
   **/
  SpRuntimeDigestDigestItem: {
    _enum: {
      Other: 'Bytes',
      __Unused1: 'Null',
      __Unused2: 'Null',
      __Unused3: 'Null',
      Consensus: '([u8;4],Bytes)',
      Seal: '([u8;4],Bytes)',
      PreRuntime: '([u8;4],Bytes)',
      __Unused7: 'Null',
      RuntimeEnvironmentUpdated: 'Null'
    }
  },
  /**
   * Lookup16: frame_system::EventRecord<joystream_node_runtime::Event, primitive_types::H256>
   **/
  FrameSystemEventRecord: {
    phase: 'FrameSystemPhase',
    event: 'Event',
    topics: 'Vec<H256>'
  },
  /**
   * Lookup18: frame_system::pallet::Event<T>
   **/
  FrameSystemEvent: {
    _enum: {
      ExtrinsicSuccess: {
        dispatchInfo: 'FrameSupportWeightsDispatchInfo',
      },
      ExtrinsicFailed: {
        dispatchError: 'SpRuntimeDispatchError',
        dispatchInfo: 'FrameSupportWeightsDispatchInfo',
      },
      CodeUpdated: 'Null',
      NewAccount: {
        account: 'AccountId32',
      },
      KilledAccount: {
        account: 'AccountId32',
      },
      Remarked: {
        _alias: {
          hash_: 'hash',
        },
        sender: 'AccountId32',
        hash_: 'H256'
      }
    }
  },
  /**
   * Lookup19: frame_support::weights::DispatchInfo
   **/
  FrameSupportWeightsDispatchInfo: {
    weight: 'u64',
    class: 'FrameSupportWeightsDispatchClass',
    paysFee: 'FrameSupportWeightsPays'
  },
  /**
   * Lookup20: frame_support::weights::DispatchClass
   **/
  FrameSupportWeightsDispatchClass: {
    _enum: ['Normal', 'Operational', 'Mandatory']
  },
  /**
   * Lookup21: frame_support::weights::Pays
   **/
  FrameSupportWeightsPays: {
    _enum: ['Yes', 'No']
  },
  /**
   * Lookup22: sp_runtime::DispatchError
   **/
  SpRuntimeDispatchError: {
    _enum: {
      Other: 'Null',
      CannotLookup: 'Null',
      BadOrigin: 'Null',
      Module: 'SpRuntimeModuleError',
      ConsumerRemaining: 'Null',
      NoProviders: 'Null',
      TooManyConsumers: 'Null',
      Token: 'SpRuntimeTokenError',
      Arithmetic: 'SpRuntimeArithmeticError',
      Transactional: 'SpRuntimeTransactionalError'
    }
  },
  /**
   * Lookup23: sp_runtime::ModuleError
   **/
  SpRuntimeModuleError: {
    index: 'u8',
    error: '[u8;4]'
  },
  /**
   * Lookup24: sp_runtime::TokenError
   **/
  SpRuntimeTokenError: {
    _enum: ['NoFunds', 'WouldDie', 'BelowMinimum', 'CannotCreate', 'UnknownAsset', 'Frozen', 'Unsupported']
  },
  /**
   * Lookup25: sp_runtime::ArithmeticError
   **/
  SpRuntimeArithmeticError: {
    _enum: ['Underflow', 'Overflow', 'DivisionByZero']
  },
  /**
   * Lookup26: sp_runtime::TransactionalError
   **/
  SpRuntimeTransactionalError: {
    _enum: ['LimitReached', 'NoLayer']
  },
  /**
   * Lookup27: pallet_utility::pallet::Event
   **/
  PalletUtilityEvent: {
    _enum: {
      BatchInterrupted: {
        index: 'u32',
        error: 'SpRuntimeDispatchError',
      },
      BatchCompleted: 'Null',
      BatchCompletedWithErrors: 'Null',
      ItemCompleted: 'Null',
      ItemFailed: {
        error: 'SpRuntimeDispatchError',
      },
      DispatchedAs: {
        result: 'Result<Null, SpRuntimeDispatchError>'
      }
    }
  },
  /**
   * Lookup30: pallet_balances::pallet::Event<T, I>
   **/
  PalletBalancesEvent: {
    _enum: {
      Endowed: {
        account: 'AccountId32',
        freeBalance: 'u128',
      },
      DustLost: {
        account: 'AccountId32',
        amount: 'u128',
      },
      Transfer: {
        from: 'AccountId32',
        to: 'AccountId32',
        amount: 'u128',
      },
      BalanceSet: {
        who: 'AccountId32',
        free: 'u128',
        reserved: 'u128',
      },
      Reserved: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Unreserved: {
        who: 'AccountId32',
        amount: 'u128',
      },
      ReserveRepatriated: {
        from: 'AccountId32',
        to: 'AccountId32',
        amount: 'u128',
        destinationStatus: 'FrameSupportTokensMiscBalanceStatus',
      },
      Deposit: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Withdraw: {
        who: 'AccountId32',
        amount: 'u128',
      },
      Slashed: {
        who: 'AccountId32',
        amount: 'u128'
      }
    }
  },
  /**
   * Lookup31: frame_support::traits::tokens::misc::BalanceStatus
   **/
  FrameSupportTokensMiscBalanceStatus: {
    _enum: ['Free', 'Reserved']
  },
  /**
   * Lookup32: pallet_election_provider_multi_phase::pallet::Event<T>
   **/
  PalletElectionProviderMultiPhaseEvent: {
    _enum: {
      SolutionStored: {
        electionCompute: 'PalletElectionProviderMultiPhaseElectionCompute',
        prevEjected: 'bool',
      },
      ElectionFinalized: {
        electionCompute: 'Option<PalletElectionProviderMultiPhaseElectionCompute>',
      },
      Rewarded: {
        account: 'AccountId32',
        value: 'u128',
      },
      Slashed: {
        account: 'AccountId32',
        value: 'u128',
      },
      SignedPhaseStarted: {
        round: 'u32',
      },
      UnsignedPhaseStarted: {
        round: 'u32'
      }
    }
  },
  /**
   * Lookup33: pallet_election_provider_multi_phase::ElectionCompute
   **/
  PalletElectionProviderMultiPhaseElectionCompute: {
    _enum: ['OnChain', 'Signed', 'Unsigned', 'Fallback', 'Emergency']
  },
  /**
   * Lookup36: pallet_staking::pallet::pallet::Event<T>
   **/
  PalletStakingPalletEvent: {
    _enum: {
      EraPaid: '(u32,u128,u128)',
      Rewarded: '(AccountId32,u128)',
      Slashed: '(AccountId32,u128)',
      OldSlashingReportDiscarded: 'u32',
      StakersElected: 'Null',
      Bonded: '(AccountId32,u128)',
      Unbonded: '(AccountId32,u128)',
      Withdrawn: '(AccountId32,u128)',
      Kicked: '(AccountId32,AccountId32)',
      StakingElectionFailed: 'Null',
      Chilled: 'AccountId32',
      PayoutStarted: '(u32,AccountId32)',
      ValidatorPrefsSet: '(AccountId32,PalletStakingValidatorPrefs)'
    }
  },
  /**
   * Lookup37: pallet_staking::ValidatorPrefs
   **/
  PalletStakingValidatorPrefs: {
    commission: 'Compact<Perbill>',
    blocked: 'bool'
  },
  /**
   * Lookup40: pallet_session::pallet::Event
   **/
  PalletSessionEvent: {
    _enum: {
      NewSession: {
        sessionIndex: 'u32'
      }
    }
  },
  /**
   * Lookup41: pallet_grandpa::pallet::Event
   **/
  PalletGrandpaEvent: {
    _enum: {
      NewAuthorities: {
        authoritySet: 'Vec<(SpFinalityGrandpaAppPublic,u64)>',
      },
      Paused: 'Null',
      Resumed: 'Null'
    }
  },
  /**
   * Lookup44: sp_finality_grandpa::app::Public
   **/
  SpFinalityGrandpaAppPublic: 'SpCoreEd25519Public',
  /**
   * Lookup45: sp_core::ed25519::Public
   **/
  SpCoreEd25519Public: '[u8;32]',
  /**
   * Lookup46: pallet_im_online::pallet::Event<T>
   **/
  PalletImOnlineEvent: {
    _enum: {
      HeartbeatReceived: {
        authorityId: 'PalletImOnlineSr25519AppSr25519Public',
      },
      AllGood: 'Null',
      SomeOffline: {
        offline: 'Vec<(AccountId32,PalletStakingExposure)>'
      }
    }
  },
  /**
   * Lookup47: pallet_im_online::sr25519::app_sr25519::Public
   **/
  PalletImOnlineSr25519AppSr25519Public: 'SpCoreSr25519Public',
  /**
   * Lookup48: sp_core::sr25519::Public
   **/
  SpCoreSr25519Public: '[u8;32]',
  /**
   * Lookup51: pallet_staking::Exposure<sp_core::crypto::AccountId32, Balance>
   **/
  PalletStakingExposure: {
    total: 'Compact<u128>',
    own: 'Compact<u128>',
    others: 'Vec<PalletStakingIndividualExposure>'
  },
  /**
   * Lookup54: pallet_staking::IndividualExposure<sp_core::crypto::AccountId32, Balance>
   **/
  PalletStakingIndividualExposure: {
    who: 'AccountId32',
    value: 'Compact<u128>'
  },
  /**
   * Lookup55: pallet_offences::pallet::Event
   **/
  PalletOffencesEvent: {
    _enum: {
      Offence: {
        kind: '[u8;16]',
        timeslot: 'Bytes'
      }
    }
  },
  /**
   * Lookup57: pallet_sudo::pallet::Event<T>
   **/
  PalletSudoEvent: {
    _enum: {
      Sudid: {
        sudoResult: 'Result<Null, SpRuntimeDispatchError>',
      },
      KeyChanged: {
        oldSudoer: 'Option<AccountId32>',
      },
      SudoAsDone: {
        sudoResult: 'Result<Null, SpRuntimeDispatchError>'
      }
    }
  },
  /**
   * Lookup59: pallet_bags_list::pallet::Event<T, I>
   **/
  PalletBagsListEvent: {
    _enum: {
      Rebagged: {
        who: 'AccountId32',
        from: 'u64',
        to: 'u64',
      },
      ScoreUpdated: {
        who: 'AccountId32',
        newScore: 'u64'
      }
    }
  },
  /**
   * Lookup60: pallet_vesting::pallet::Event<T>
   **/
  PalletVestingEvent: {
    _enum: {
      VestingUpdated: {
        account: 'AccountId32',
        unvested: 'u128',
      },
      VestingCompleted: {
        account: 'AccountId32'
      }
    }
  },
  /**
   * Lookup61: pallet_multisig::pallet::Event<T>
   **/
  PalletMultisigEvent: {
    _enum: {
      NewMultisig: {
        approving: 'AccountId32',
        multisig: 'AccountId32',
        callHash: '[u8;32]',
      },
      MultisigApproval: {
        approving: 'AccountId32',
        timepoint: 'PalletMultisigTimepoint',
        multisig: 'AccountId32',
        callHash: '[u8;32]',
      },
      MultisigExecuted: {
        approving: 'AccountId32',
        timepoint: 'PalletMultisigTimepoint',
        multisig: 'AccountId32',
        callHash: '[u8;32]',
        result: 'Result<Null, SpRuntimeDispatchError>',
      },
      MultisigCancelled: {
        cancelling: 'AccountId32',
        timepoint: 'PalletMultisigTimepoint',
        multisig: 'AccountId32',
        callHash: '[u8;32]'
      }
    }
  },
  /**
   * Lookup62: pallet_multisig::Timepoint<BlockNumber>
   **/
  PalletMultisigTimepoint: {
    height: 'u32',
    index: 'u32'
  },
  /**
   * Lookup63: pallet_council::RawEvent<Balance, BlockNumber, MemberId, sp_core::crypto::AccountId32>
   **/
  PalletCouncilRawEvent: {
    _enum: {
      AnnouncingPeriodStarted: 'u32',
      NotEnoughCandidates: 'u32',
      VotingPeriodStarted: 'u64',
      NewCandidate: '(u64,AccountId32,AccountId32,u128)',
      NewCouncilElected: '(Vec<u64>,u32)',
      NewCouncilNotElected: 'u32',
      CandidacyStakeRelease: 'u64',
      CandidacyWithdraw: 'u64',
      CandidacyNoteSet: '(u64,Bytes)',
      RewardPayment: '(u64,AccountId32,u128,u128)',
      BudgetBalanceSet: 'u128',
      BudgetRefill: 'u128',
      BudgetRefillPlanned: 'u32',
      BudgetIncrementUpdated: 'u128',
      CouncilorRewardUpdated: 'u128',
      RequestFunded: '(AccountId32,u128)',
      CouncilBudgetFunded: '(u64,u128,Bytes)',
      CouncilorRemarked: '(u64,Bytes)',
      CandidateRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup65: pallet_referendum::RawEvent<BlockNumber, Balance, primitive_types::H256, sp_core::crypto::AccountId32, VotePower, MemberId, pallet_referendum::Instance1>
   **/
  PalletReferendumRawEvent: {
    _enum: {
      ReferendumStarted: '(u64,u32)',
      ReferendumStartedForcefully: '(u64,u32)',
      RevealingStageStarted: 'u32',
      ReferendumFinished: 'Vec<PalletReferendumOptionResult>',
      VoteCast: '(AccountId32,H256,u128)',
      VoteRevealed: '(AccountId32,u64,Bytes)',
      StakeReleased: 'AccountId32'
    }
  },
  /**
   * Lookup66: pallet_referendum::Instance1
   **/
  PalletReferendumInstance1: 'Null',
  /**
   * Lookup68: pallet_referendum::OptionResult<MemberId, VotePower>
   **/
  PalletReferendumOptionResult: {
    optionId: 'u64',
    votePower: 'u128'
  },
  /**
   * Lookup69: pallet_membership::RawEvent<MemberId, Balance, sp_core::crypto::AccountId32, pallet_membership::BuyMembershipParameters<sp_core::crypto::AccountId32, MemberId>, ActorId, pallet_membership::InviteMembershipParameters<sp_core::crypto::AccountId32, MemberId>, pallet_membership::CreateFoundingMemberParameters<sp_core::crypto::AccountId32>, pallet_membership::GiftMembershipParameters<sp_core::crypto::AccountId32, Balance>>
   **/
  PalletMembershipRawEvent: {
    _enum: {
      MemberInvited: '(u64,PalletMembershipInviteMembershipParameters)',
      MembershipGifted: '(u64,PalletMembershipGiftMembershipParameters)',
      MembershipBought: '(u64,PalletMembershipBuyMembershipParameters)',
      MemberProfileUpdated: '(u64,Option<Bytes>,Option<Bytes>)',
      MemberAccountsUpdated: '(u64,Option<AccountId32>,Option<AccountId32>)',
      MemberVerificationStatusUpdated: '(u64,bool,u64)',
      ReferralCutUpdated: 'u8',
      InvitesTransferred: '(u64,u64,u32)',
      MembershipPriceUpdated: 'u128',
      InitialInvitationBalanceUpdated: 'u128',
      LeaderInvitationQuotaUpdated: 'u32',
      InitialInvitationCountUpdated: 'u32',
      StakingAccountAdded: '(AccountId32,u64)',
      StakingAccountRemoved: '(AccountId32,u64)',
      StakingAccountConfirmed: '(AccountId32,u64)',
      MemberRemarked: '(u64,Bytes)',
      FoundingMemberCreated: '(u64,PalletMembershipCreateFoundingMemberParameters)'
    }
  },
  /**
   * Lookup70: pallet_membership::BuyMembershipParameters<sp_core::crypto::AccountId32, MemberId>
   **/
  PalletMembershipBuyMembershipParameters: {
    rootAccount: 'AccountId32',
    controllerAccount: 'AccountId32',
    handle: 'Option<Bytes>',
    metadata: 'Bytes',
    referrerId: 'Option<u64>'
  },
  /**
   * Lookup73: pallet_membership::InviteMembershipParameters<sp_core::crypto::AccountId32, MemberId>
   **/
  PalletMembershipInviteMembershipParameters: {
    invitingMemberId: 'u64',
    rootAccount: 'AccountId32',
    controllerAccount: 'AccountId32',
    handle: 'Option<Bytes>',
    metadata: 'Bytes'
  },
  /**
   * Lookup74: pallet_membership::CreateFoundingMemberParameters<sp_core::crypto::AccountId32>
   **/
  PalletMembershipCreateFoundingMemberParameters: {
    rootAccount: 'AccountId32',
    controllerAccount: 'AccountId32',
    handle: 'Bytes',
    metadata: 'Bytes'
  },
  /**
   * Lookup75: pallet_membership::GiftMembershipParameters<sp_core::crypto::AccountId32, Balance>
   **/
  PalletMembershipGiftMembershipParameters: {
    rootAccount: 'AccountId32',
    controllerAccount: 'AccountId32',
    handle: 'Option<Bytes>',
    metadata: 'Bytes',
    creditControllerAccount: 'u128',
    applyControllerAccountInvitationLock: 'Option<u128>',
    creditRootAccount: 'u128',
    applyRootAccountInvitationLock: 'Option<u128>'
  },
  /**
   * Lookup77: pallet_forum::RawEvent<CategoryId, ModeratorId, ThreadId, PostId, primitive_types::H256, ForumUserId, PostReactionId, pallet_forum::PrivilegedActor<T>, pallet_forum::ExtendedPostIdObject<CategoryId, ThreadId, PostId>>
   **/
  PalletForumRawEvent: {
    _enum: {
      CategoryCreated: '(u64,Option<u64>,Bytes,Bytes)',
      CategoryArchivalStatusUpdated: '(u64,bool,PalletForumPrivilegedActor)',
      CategoryTitleUpdated: '(u64,H256,PalletForumPrivilegedActor)',
      CategoryDescriptionUpdated: '(u64,H256,PalletForumPrivilegedActor)',
      CategoryDeleted: '(u64,PalletForumPrivilegedActor)',
      ThreadCreated: '(u64,u64,u64,u64,Bytes,Bytes)',
      ThreadModerated: '(u64,Bytes,PalletForumPrivilegedActor,u64)',
      ThreadUpdated: '(u64,bool,PalletForumPrivilegedActor,u64)',
      ThreadMetadataUpdated: '(u64,u64,u64,Bytes)',
      ThreadDeleted: '(u64,u64,u64,bool)',
      ThreadMoved: '(u64,u64,PalletForumPrivilegedActor,u64)',
      PostAdded: '(u64,u64,u64,u64,Bytes,bool)',
      PostModerated: '(u64,Bytes,PalletForumPrivilegedActor,u64,u64)',
      PostDeleted: '(Bytes,u64,BTreeMap<PalletForumExtendedPostIdObject, bool>)',
      PostTextUpdated: '(u64,u64,u64,u64,Bytes)',
      PostReacted: '(u64,u64,u64,u64,u64)',
      CategoryStickyThreadUpdate: '(u64,Vec<u64>,PalletForumPrivilegedActor)',
      CategoryMembershipOfModeratorUpdated: '(u64,u64,bool)'
    }
  },
  /**
   * Lookup78: pallet_forum::PrivilegedActor<T>
   **/
  PalletForumPrivilegedActor: {
    _enum: {
      Lead: 'Null',
      Moderator: 'u64'
    }
  },
  /**
   * Lookup79: pallet_forum::ExtendedPostIdObject<CategoryId, ThreadId, PostId>
   **/
  PalletForumExtendedPostIdObject: {
    categoryId: 'u64',
    threadId: 'u64',
    postId: 'u64'
  },
  /**
   * Lookup83: pallet_constitution::Event
   **/
  PalletConstitutionEvent: {
    _enum: {
      ConstutionAmended: '(Bytes,Bytes)'
    }
  },
  /**
   * Lookup84: pallet_utility::RawEvent<Balance, sp_core::crypto::AccountId32>
   **/
  PalletUtilityRawEvent: {
    _enum: {
      Signaled: 'Bytes',
      RuntimeUpgraded: 'Bytes',
      UpdatedWorkingGroupBudget: '(PalletCommonWorkingGroup,u128,PalletCommonBalanceKind)',
      TokensBurned: '(AccountId32,u128)'
    }
  },
  /**
   * Lookup85: pallet_common::working_group::WorkingGroup
   **/
  PalletCommonWorkingGroup: {
    _enum: ['Forum', 'Storage', 'Content', 'OperationsAlpha', 'Gateway', 'Distribution', 'OperationsBeta', 'OperationsGamma', 'Membership']
  },
  /**
   * Lookup86: pallet_common::BalanceKind
   **/
  PalletCommonBalanceKind: {
    _enum: ['Positive', 'Negative']
  },
  /**
   * Lookup87: pallet_content::RawEvent<pallet_content::permissions::ContentActor<CuratorGroupId, CuratorId, MemberId>, MemberId, CuratorGroupId, CuratorId, VideoId, ChannelId, pallet_content::types::ChannelRecord<MemberId, CuratorGroupId, Balance, ChannelPrivilegeLevel, DataObjectId, BlockNumber, TokenId, TransferId>, DataObjectId, pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, OpenAuctionId, pallet_content::nft::types::NftIssuanceParametersRecord<MemberId, pallet_content::nft::types::InitTransactionalStatusRecord<pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, MemberId, Balance>>, Balance, pallet_content::types::ChannelCreationParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, MemberId, StorageBucketId, pallet_storage::DistributionBucketIdRecord<DistributionBucketFamilyId, DistributionBucketIndex>, Balance>, pallet_content::types::ChannelUpdateParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, DataObjectId, MemberId, Balance>, pallet_content::types::VideoCreationParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, pallet_content::nft::types::NftIssuanceParametersRecord<MemberId, pallet_content::nft::types::InitTransactionalStatusRecord<pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, MemberId, Balance>>, Balance>, pallet_content::types::VideoUpdateParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, DataObjectId, pallet_content::nft::types::NftIssuanceParametersRecord<MemberId, pallet_content::nft::types::InitTransactionalStatusRecord<pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, MemberId, Balance>>, Balance>, ChannelPrivilegeLevel, BTreeMap<K, BTreeSet<pallet_content::permissions::curator_group::ContentModerationAction>>, pallet_content::types::TransferCommitmentParameters<MemberId, Balance, TransferId>, pallet_content::types::PendingTransfer<MemberId, CuratorGroupId, Balance, TransferId>, sp_core::crypto::AccountId32, pallet_content::types::UpdateChannelPayoutsParametersRecord<pallet_content::types::ChannelPayoutsPayloadParametersRecord<sp_core::crypto::AccountId32, Balance>, Balance, primitive_types::H256>, TokenId, pallet_content::types::ChannelFundsDestination<sp_core::crypto::AccountId32>>
   **/
  PalletContentRawEvent: {
    _enum: {
      CuratorGroupCreated: 'u64',
      CuratorGroupPermissionsUpdated: '(u64,BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupContentModerationAction>>)',
      CuratorGroupStatusSet: '(u64,bool)',
      CuratorAdded: '(u64,u64,BTreeSet<PalletContentChannelActionPermission>)',
      CuratorRemoved: '(u64,u64)',
      ChannelCreated: '(u64,PalletContentChannelRecord,PalletContentChannelCreationParametersRecord,AccountId32)',
      ChannelUpdated: '(PalletContentPermissionsContentActor,u64,PalletContentChannelUpdateParametersRecord,BTreeSet<u64>)',
      ChannelPrivilegeLevelUpdated: '(u64,u8)',
      ChannelStateBloatBondValueUpdated: 'u128',
      VideoStateBloatBondValueUpdated: 'u128',
      ChannelAssetsRemoved: '(PalletContentPermissionsContentActor,u64,BTreeSet<u64>,PalletContentChannelRecord)',
      ChannelDeleted: '(PalletContentPermissionsContentActor,u64)',
      ChannelDeletedByModerator: '(PalletContentPermissionsContentActor,u64,Bytes)',
      ChannelVisibilitySetByModerator: '(PalletContentPermissionsContentActor,u64,bool,Bytes)',
      ChannelPausedFeaturesUpdatedByModerator: '(PalletContentPermissionsContentActor,u64,BTreeSet<PalletContentPermissionsCuratorGroupPausableChannelFeature>,Bytes)',
      ChannelAssetsDeletedByModerator: '(PalletContentPermissionsContentActor,u64,BTreeSet<u64>,Bytes)',
      ChannelFundsWithdrawn: '(PalletContentPermissionsContentActor,u64,u128,PalletContentChannelFundsDestination)',
      ChannelRewardClaimedAndWithdrawn: '(PalletContentPermissionsContentActor,u64,u128,PalletContentChannelFundsDestination)',
      VideoCreated: '(PalletContentPermissionsContentActor,u64,u64,PalletContentVideoCreationParametersRecord,BTreeSet<u64>)',
      VideoUpdated: '(PalletContentPermissionsContentActor,u64,PalletContentVideoUpdateParametersRecord,BTreeSet<u64>)',
      VideoDeleted: '(PalletContentPermissionsContentActor,u64)',
      VideoDeletedByModerator: '(PalletContentPermissionsContentActor,u64,Bytes)',
      VideoVisibilitySetByModerator: '(PalletContentPermissionsContentActor,u64,bool,Bytes)',
      VideoAssetsDeletedByModerator: '(PalletContentPermissionsContentActor,u64,BTreeSet<u64>,bool,Bytes)',
      ChannelPayoutsUpdated: '(PalletContentUpdateChannelPayoutsParametersRecord,Option<u64>)',
      ChannelRewardUpdated: '(u128,u64)',
      CouncilRewardClaimed: '(u64,u128)',
      EnglishAuctionStarted: '(PalletContentPermissionsContentActor,u64,PalletContentNftTypesEnglishAuctionParamsRecord)',
      OpenAuctionStarted: '(PalletContentPermissionsContentActor,u64,PalletContentNftTypesOpenAuctionParamsRecord,u64)',
      NftIssued: '(PalletContentPermissionsContentActor,u64,PalletContentNftTypesNftIssuanceParametersRecord)',
      NftDestroyed: '(PalletContentPermissionsContentActor,u64)',
      AuctionBidMade: '(u64,u64,u128,Option<u64>)',
      AuctionBidCanceled: '(u64,u64)',
      AuctionCanceled: '(PalletContentPermissionsContentActor,u64)',
      EnglishAuctionSettled: '(u64,AccountId32,u64)',
      BidMadeCompletingAuction: '(u64,u64,Option<u64>)',
      OpenAuctionBidAccepted: '(PalletContentPermissionsContentActor,u64,u64,u128)',
      OfferStarted: '(u64,PalletContentPermissionsContentActor,u64,Option<u128>)',
      OfferAccepted: 'u64',
      OfferCanceled: '(u64,PalletContentPermissionsContentActor)',
      NftSellOrderMade: '(u64,PalletContentPermissionsContentActor,u128)',
      NftBought: '(u64,u64)',
      BuyNowCanceled: '(u64,PalletContentPermissionsContentActor)',
      BuyNowPriceUpdated: '(u64,PalletContentPermissionsContentActor,u128)',
      NftSlingedBackToTheOriginalArtist: '(u64,PalletContentPermissionsContentActor)',
      ChannelOwnerRemarked: '(u64,Bytes)',
      ChannelAgentRemarked: '(PalletContentPermissionsContentActor,u64,Bytes)',
      NftOwnerRemarked: '(PalletContentPermissionsContentActor,u64,Bytes)',
      InitializedChannelTransfer: '(u64,PalletContentPermissionsContentActor,PalletContentPendingTransfer)',
      CancelChannelTransfer: '(u64,PalletContentPermissionsContentActor)',
      ChannelTransferAccepted: '(u64,PalletContentTransferCommitmentParameters)',
      GlobalNftLimitUpdated: '(PalletContentNftLimitPeriod,u64)',
      ChannelNftLimitUpdated: '(PalletContentPermissionsContentActor,PalletContentNftLimitPeriod,u64,u64)',
      ToggledNftLimits: 'bool',
      CreatorTokenIssued: '(PalletContentPermissionsContentActor,u64,u64)'
    }
  },
  /**
   * Lookup88: pallet_content::permissions::ContentActor<CuratorGroupId, CuratorId, MemberId>
   **/
  PalletContentPermissionsContentActor: {
    _enum: {
      Curator: '(u64,u64)',
      Member: 'u64',
      Lead: 'Null'
    }
  },
  /**
   * Lookup89: pallet_content::types::ChannelRecord<MemberId, CuratorGroupId, Balance, ChannelPrivilegeLevel, DataObjectId, BlockNumber, TokenId, TransferId>
   **/
  PalletContentChannelRecord: {
    owner: 'PalletContentChannelOwner',
    numVideos: 'u64',
    collaborators: 'BTreeMap<u64, BTreeSet<PalletContentChannelActionPermission>>',
    cumulativeRewardClaimed: 'u128',
    privilegeLevel: 'u8',
    pausedFeatures: 'BTreeSet<PalletContentPermissionsCuratorGroupPausableChannelFeature>',
    transferStatus: 'PalletContentChannelTransferStatus',
    dataObjects: 'BTreeSet<u64>',
    dailyNftLimit: 'PalletContentLimitPerPeriod',
    weeklyNftLimit: 'PalletContentLimitPerPeriod',
    dailyNftCounter: 'PalletContentNftCounter',
    weeklyNftCounter: 'PalletContentNftCounter',
    creatorTokenId: 'Option<u64>',
    channelStateBloatBond: 'u128'
  },
  /**
   * Lookup90: pallet_content::types::ChannelOwner<MemberId, CuratorGroupId>
   **/
  PalletContentChannelOwner: {
    _enum: {
      Member: 'u64',
      CuratorGroup: 'u64'
    }
  },
  /**
   * Lookup93: pallet_content::types::ChannelActionPermission
   **/
  PalletContentChannelActionPermission: {
    _enum: ['UpdateChannelMetadata', 'ManageNonVideoChannelAssets', 'ManageChannelCollaborators', 'UpdateVideoMetadata', 'AddVideo', 'ManageVideoAssets', 'DeleteChannel', 'DeleteVideo', 'ManageVideoNfts', 'AgentRemark', 'TransferChannel', 'ClaimChannelReward', 'WithdrawFromChannelBalance', 'IssueCreatorToken', 'ClaimCreatorTokenPatronage', 'InitAndManageCreatorTokenSale', 'CreatorTokenIssuerTransfer', 'MakeCreatorTokenPermissionless', 'ReduceCreatorTokenPatronageRate', 'ManageRevenueSplits', 'DeissueCreatorToken']
  },
  /**
   * Lookup98: pallet_content::permissions::curator_group::PausableChannelFeature
   **/
  PalletContentPermissionsCuratorGroupPausableChannelFeature: {
    _enum: ['ChannelFundsTransfer', 'CreatorCashout', 'VideoNftIssuance', 'VideoCreation', 'VideoUpdate', 'ChannelUpdate', 'CreatorTokenIssuance']
  },
  /**
   * Lookup100: pallet_content::types::ChannelTransferStatus<MemberId, CuratorGroupId, Balance, TransferId>
   **/
  PalletContentChannelTransferStatus: {
    _enum: {
      NoActiveTransfer: 'Null',
      PendingTransfer: 'PalletContentPendingTransfer'
    }
  },
  /**
   * Lookup101: pallet_content::types::PendingTransfer<MemberId, CuratorGroupId, Balance, TransferId>
   **/
  PalletContentPendingTransfer: {
    newOwner: 'PalletContentChannelOwner',
    transferParams: 'PalletContentTransferCommitmentParameters'
  },
  /**
   * Lookup102: pallet_content::types::TransferCommitmentParameters<MemberId, Balance, TransferId>
   **/
  PalletContentTransferCommitmentParameters: {
    newCollaborators: 'BTreeMap<u64, BTreeSet<PalletContentChannelActionPermission>>',
    price: 'u128',
    transferId: 'u64'
  },
  /**
   * Lookup104: pallet_content::types::LimitPerPeriod<BlockNumber>
   **/
  PalletContentLimitPerPeriod: {
    limit: 'u64',
    blockNumberPeriod: 'u32'
  },
  /**
   * Lookup105: pallet_content::types::NftCounter<BlockNumber>
   **/
  PalletContentNftCounter: {
    counter: 'u64',
    lastUpdated: 'u32'
  },
  /**
   * Lookup106: pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>
   **/
  PalletContentNftTypesEnglishAuctionParamsRecord: {
    startingPrice: 'u128',
    buyNowPrice: 'Option<u128>',
    whitelist: 'BTreeSet<u64>',
    startsAt: 'Option<u32>',
    duration: 'u32',
    extensionPeriod: 'u32',
    minBidStep: 'u128'
  },
  /**
   * Lookup108: pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>
   **/
  PalletContentNftTypesOpenAuctionParamsRecord: {
    startingPrice: 'u128',
    buyNowPrice: 'Option<u128>',
    startsAt: 'Option<u32>',
    whitelist: 'BTreeSet<u64>',
    bidLockDuration: 'u32'
  },
  /**
   * Lookup109: pallet_content::nft::types::NftIssuanceParametersRecord<MemberId, pallet_content::nft::types::InitTransactionalStatusRecord<pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, MemberId, Balance>>
   **/
  PalletContentNftTypesNftIssuanceParametersRecord: {
    royalty: 'Option<Perbill>',
    nftMetadata: 'Bytes',
    nonChannelOwner: 'Option<u64>',
    initTransactionalStatus: 'PalletContentNftTypesInitTransactionalStatusRecord'
  },
  /**
   * Lookup110: pallet_content::nft::types::InitTransactionalStatusRecord<pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, MemberId, Balance>
   **/
  PalletContentNftTypesInitTransactionalStatusRecord: {
    _enum: {
      Idle: 'Null',
      BuyNow: 'u128',
      InitiatedOfferToMember: '(u64,Option<u128>)',
      EnglishAuction: 'PalletContentNftTypesEnglishAuctionParamsRecord',
      OpenAuction: 'PalletContentNftTypesOpenAuctionParamsRecord'
    }
  },
  /**
   * Lookup112: pallet_content::types::ChannelCreationParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, MemberId, StorageBucketId, pallet_storage::DistributionBucketIdRecord<DistributionBucketFamilyId, DistributionBucketIndex>, Balance>
   **/
  PalletContentChannelCreationParametersRecord: {
    assets: 'Option<PalletContentStorageAssetsRecord>',
    meta: 'Option<Bytes>',
    collaborators: 'BTreeMap<u64, BTreeSet<PalletContentChannelActionPermission>>',
    storageBuckets: 'BTreeSet<u64>',
    distributionBuckets: 'BTreeSet<PalletStorageDistributionBucketIdRecord>',
    expectedChannelStateBloatBond: 'u128',
    expectedDataObjectStateBloatBond: 'u128'
  },
  /**
   * Lookup113: pallet_content::types::StorageAssetsRecord<Balance>
   **/
  PalletContentStorageAssetsRecord: {
    objectCreationList: 'Vec<PalletStorageDataObjectCreationParameters>',
    expectedDataSizeFee: 'u128'
  },
  /**
   * Lookup115: pallet_storage::DataObjectCreationParameters
   **/
  PalletStorageDataObjectCreationParameters: {
    _alias: {
      size_: 'size'
    },
    size_: 'u64',
    ipfsContentId: 'Bytes'
  },
  /**
   * Lookup116: pallet_storage::DistributionBucketIdRecord<DistributionBucketFamilyId, DistributionBucketIndex>
   **/
  PalletStorageDistributionBucketIdRecord: {
    distributionBucketFamilyId: 'u64',
    distributionBucketIndex: 'u64'
  },
  /**
   * Lookup120: pallet_content::types::ChannelUpdateParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, DataObjectId, MemberId, Balance>
   **/
  PalletContentChannelUpdateParametersRecord: {
    assetsToUpload: 'Option<PalletContentStorageAssetsRecord>',
    newMeta: 'Option<Bytes>',
    assetsToRemove: 'BTreeSet<u64>',
    collaborators: 'Option<BTreeMap<u64, BTreeSet<PalletContentChannelActionPermission>>>',
    expectedDataObjectStateBloatBond: 'u128'
  },
  /**
   * Lookup122: pallet_content::types::VideoCreationParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, pallet_content::nft::types::NftIssuanceParametersRecord<MemberId, pallet_content::nft::types::InitTransactionalStatusRecord<pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, MemberId, Balance>>, Balance>
   **/
  PalletContentVideoCreationParametersRecord: {
    assets: 'Option<PalletContentStorageAssetsRecord>',
    meta: 'Option<Bytes>',
    autoIssueNft: 'Option<PalletContentNftTypesNftIssuanceParametersRecord>',
    expectedVideoStateBloatBond: 'u128',
    expectedDataObjectStateBloatBond: 'u128'
  },
  /**
   * Lookup124: pallet_content::types::VideoUpdateParametersRecord<pallet_content::types::StorageAssetsRecord<Balance>, DataObjectId, pallet_content::nft::types::NftIssuanceParametersRecord<MemberId, pallet_content::nft::types::InitTransactionalStatusRecord<pallet_content::nft::types::EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>, MemberId, Balance>>, Balance>
   **/
  PalletContentVideoUpdateParametersRecord: {
    assetsToUpload: 'Option<PalletContentStorageAssetsRecord>',
    newMeta: 'Option<Bytes>',
    assetsToRemove: 'BTreeSet<u64>',
    autoIssueNft: 'Option<PalletContentNftTypesNftIssuanceParametersRecord>',
    expectedDataObjectStateBloatBond: 'u128'
  },
  /**
   * Lookup127: pallet_content::permissions::curator_group::ContentModerationAction
   **/
  PalletContentPermissionsCuratorGroupContentModerationAction: {
    _enum: {
      HideVideo: 'Null',
      HideChannel: 'Null',
      ChangeChannelFeatureStatus: 'PalletContentPermissionsCuratorGroupPausableChannelFeature',
      DeleteVideo: 'Null',
      DeleteChannel: 'Null',
      DeleteVideoAssets: 'bool',
      DeleteNonVideoChannelAssets: 'Null',
      UpdateChannelNftLimits: 'Null'
    }
  },
  /**
   * Lookup131: pallet_content::types::UpdateChannelPayoutsParametersRecord<pallet_content::types::ChannelPayoutsPayloadParametersRecord<sp_core::crypto::AccountId32, Balance>, Balance, primitive_types::H256>
   **/
  PalletContentUpdateChannelPayoutsParametersRecord: {
    commitment: 'Option<H256>',
    payload: 'Option<PalletContentChannelPayoutsPayloadParametersRecord>',
    minCashoutAllowed: 'Option<u128>',
    maxCashoutAllowed: 'Option<u128>',
    channelCashoutsEnabled: 'Option<bool>'
  },
  /**
   * Lookup132: pallet_content::types::ChannelPayoutsPayloadParametersRecord<sp_core::crypto::AccountId32, Balance>
   **/
  PalletContentChannelPayoutsPayloadParametersRecord: {
    uploaderAccount: 'AccountId32',
    objectCreationParams: 'PalletStorageDataObjectCreationParameters',
    expectedDataSizeFee: 'u128',
    expectedDataObjectStateBloatBond: 'u128'
  },
  /**
   * Lookup136: pallet_content::types::ChannelFundsDestination<sp_core::crypto::AccountId32>
   **/
  PalletContentChannelFundsDestination: {
    _enum: {
      AccountId: 'AccountId32',
      CouncilBudget: 'Null'
    }
  },
  /**
   * Lookup137: pallet_content::types::NftLimitPeriod
   **/
  PalletContentNftLimitPeriod: {
    _enum: ['Daily', 'Weekly']
  },
  /**
   * Lookup138: pallet_storage::RawEvent<StorageBucketId, WorkerId, DataObjectId, pallet_storage::UploadParametersRecord<pallet_storage::BagIdType<MemberId, ChannelId>, sp_core::crypto::AccountId32, Balance>, pallet_storage::BagIdType<MemberId, ChannelId>, pallet_storage::DynamicBagIdType<MemberId, ChannelId>, sp_core::crypto::AccountId32, Balance, DistributionBucketFamilyId, pallet_storage::DistributionBucketIdRecord<DistributionBucketFamilyId, DistributionBucketIndex>, DistributionBucketIndex>
   **/
  PalletStorageRawEvent: {
    _enum: {
      StorageBucketCreated: '(u64,Option<u64>,bool,u64,u64)',
      StorageBucketInvitationAccepted: '(u64,u64,AccountId32)',
      StorageBucketsUpdatedForBag: '(PalletStorageBagIdType,BTreeSet<u64>,BTreeSet<u64>)',
      DataObjectsUploaded: '(BTreeSet<u64>,PalletStorageUploadParametersRecord,u128)',
      StorageOperatorMetadataSet: '(u64,u64,Bytes)',
      StorageBucketVoucherLimitsSet: '(u64,u64,u64)',
      PendingDataObjectsAccepted: '(u64,u64,PalletStorageBagIdType,BTreeSet<u64>)',
      StorageBucketInvitationCancelled: 'u64',
      StorageBucketOperatorInvited: '(u64,u64)',
      StorageBucketOperatorRemoved: 'u64',
      UploadingBlockStatusUpdated: 'bool',
      DataObjectPerMegabyteFeeUpdated: 'u128',
      StorageBucketsPerBagLimitUpdated: 'u64',
      StorageBucketsVoucherMaxLimitsUpdated: '(u64,u64)',
      DataObjectsMoved: '(PalletStorageBagIdType,PalletStorageBagIdType,BTreeSet<u64>)',
      DataObjectsDeleted: '(AccountId32,PalletStorageBagIdType,BTreeSet<u64>)',
      StorageBucketStatusUpdated: '(u64,bool)',
      UpdateBlacklist: '(BTreeSet<Bytes>,BTreeSet<Bytes>)',
      DynamicBagDeleted: '(AccountId32,PalletStorageDynamicBagIdType)',
      DynamicBagCreated: '(PalletStorageDynamicBagIdType,BTreeSet<u64>,BTreeSet<PalletStorageDistributionBucketIdRecord>)',
      VoucherChanged: '(u64,PalletStorageVoucher)',
      StorageBucketDeleted: 'u64',
      NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated: '(PalletStorageDynamicBagType,u64)',
      DistributionBucketFamilyCreated: 'u64',
      DistributionBucketFamilyDeleted: 'u64',
      DistributionBucketCreated: '(u64,bool,PalletStorageDistributionBucketIdRecord)',
      DistributionBucketStatusUpdated: '(PalletStorageDistributionBucketIdRecord,bool)',
      DistributionBucketDeleted: 'PalletStorageDistributionBucketIdRecord',
      DistributionBucketsUpdatedForBag: '(PalletStorageBagIdType,u64,BTreeSet<u64>,BTreeSet<u64>)',
      DistributionBucketsPerBagLimitUpdated: 'u64',
      DistributionBucketModeUpdated: '(PalletStorageDistributionBucketIdRecord,bool)',
      FamiliesInDynamicBagCreationPolicyUpdated: '(PalletStorageDynamicBagType,BTreeMap<u64, u32>)',
      DistributionBucketOperatorInvited: '(PalletStorageDistributionBucketIdRecord,u64)',
      DistributionBucketInvitationCancelled: '(PalletStorageDistributionBucketIdRecord,u64)',
      DistributionBucketInvitationAccepted: '(u64,PalletStorageDistributionBucketIdRecord)',
      DistributionBucketMetadataSet: '(u64,PalletStorageDistributionBucketIdRecord,Bytes)',
      DistributionBucketOperatorRemoved: '(PalletStorageDistributionBucketIdRecord,u64)',
      DistributionBucketFamilyMetadataSet: '(u64,Bytes)',
      DataObjectStateBloatBondValueUpdated: 'u128',
      DataObjectsUpdated: '(PalletStorageUploadParametersRecord,BTreeSet<u64>,BTreeSet<u64>)',
      StorageOperatorRemarked: '(u64,u64,Bytes)',
      DistributionOperatorRemarked: '(u64,PalletStorageDistributionBucketIdRecord,Bytes)'
    }
  },
  /**
   * Lookup139: pallet_storage::UploadParametersRecord<pallet_storage::BagIdType<MemberId, ChannelId>, sp_core::crypto::AccountId32, Balance>
   **/
  PalletStorageUploadParametersRecord: {
    bagId: 'PalletStorageBagIdType',
    objectCreationList: 'Vec<PalletStorageDataObjectCreationParameters>',
    stateBloatBondSourceAccountId: 'AccountId32',
    expectedDataSizeFee: 'u128',
    expectedDataObjectStateBloatBond: 'u128'
  },
  /**
   * Lookup140: pallet_storage::BagIdType<MemberId, ChannelId>
   **/
  PalletStorageBagIdType: {
    _enum: {
      Static: 'PalletStorageStaticBagId',
      Dynamic: 'PalletStorageDynamicBagIdType'
    }
  },
  /**
   * Lookup141: pallet_storage::StaticBagId
   **/
  PalletStorageStaticBagId: {
    _enum: {
      Council: 'Null',
      WorkingGroup: 'PalletCommonWorkingGroup'
    }
  },
  /**
   * Lookup142: pallet_storage::DynamicBagIdType<MemberId, ChannelId>
   **/
  PalletStorageDynamicBagIdType: {
    _enum: {
      Member: 'u64',
      Channel: 'u64'
    }
  },
  /**
   * Lookup145: pallet_storage::Voucher
   **/
  PalletStorageVoucher: {
    sizeLimit: 'u64',
    objectsLimit: 'u64',
    sizeUsed: 'u64',
    objectsUsed: 'u64'
  },
  /**
   * Lookup146: pallet_storage::DynamicBagType
   **/
  PalletStorageDynamicBagType: {
    _enum: ['Member', 'Channel']
  },
  /**
   * Lookup150: pallet_project_token::events::RawEvent<Balance, JoyBalance, TokenId, sp_core::crypto::AccountId32, MemberId, BlockNumber, pallet_project_token::types::TransferPolicy<primitive_types::H256>, pallet_project_token::types::TokenIssuanceParameters<primitive_types::H256, pallet_project_token::types::TokenAllocation<Balance, pallet_project_token::types::VestingScheduleParams<BlockNumber>>, pallet_project_token::types::TransferPolicyParams<pallet_project_token::types::WhitelistParams<primitive_types::H256, pallet_project_token::types::SingleDataObjectUploadParams<JoyBalance>>>, MemberId>, pallet_project_token::types::Transfers<pallet_project_token::types::Validated<MemberId>, pallet_project_token::types::ValidatedPayment<pallet_project_token::types::PaymentWithVesting<Balance, pallet_project_token::types::VestingScheduleParams<BlockNumber>>>>, pallet_project_token::types::TokenSale<JoyBalance, Balance, BlockNumber, pallet_project_token::types::VestingScheduleParams<BlockNumber>, MemberId, sp_core::crypto::AccountId32>>
   **/
  PalletProjectTokenEventsRawEvent: {
    _enum: {
      TokenAmountTransferred: '(u64,u64,BTreeMap<PalletProjectTokenValidated, PalletProjectTokenValidatedPayment>)',
      TokenAmountTransferredByIssuer: '(u64,u64,BTreeMap<PalletProjectTokenValidated, PalletProjectTokenValidatedPayment>)',
      PatronageRateDecreasedTo: '(u64,Perquintill)',
      PatronageCreditClaimed: '(u64,u128,u64)',
      RevenueSplitIssued: '(u64,u32,u32,u128)',
      RevenueSplitFinalized: '(u64,AccountId32,u128)',
      UserParticipatedInSplit: '(u64,u64,u128,u128,u32)',
      RevenueSplitLeft: '(u64,u64,u128)',
      MemberJoinedWhitelist: '(u64,u64,PalletProjectTokenTransferPolicy)',
      AccountDustedBy: '(u64,u64,AccountId32,PalletProjectTokenTransferPolicy)',
      TokenDeissued: 'u64',
      TokenIssued: '(u64,PalletProjectTokenTokenIssuanceParameters)',
      TokenSaleInitialized: '(u64,u32,PalletProjectTokenTokenSale,Option<Bytes>)',
      UpcomingTokenSaleUpdated: '(u64,u32,Option<u32>,Option<u32>)',
      TokensPurchasedOnSale: '(u64,u32,u128,u64)',
      TokenSaleFinalized: '(u64,u32,u128,u128)',
      TransferPolicyChangedToPermissionless: 'u64',
      TokensBurned: '(u64,u64,u128)'
    }
  },
  /**
   * Lookup151: pallet_project_token::types::TransferPolicy<primitive_types::H256>
   **/
  PalletProjectTokenTransferPolicy: {
    _enum: {
      Permissionless: 'Null',
      Permissioned: 'H256'
    }
  },
  /**
   * Lookup152: pallet_project_token::types::TokenIssuanceParameters<primitive_types::H256, pallet_project_token::types::TokenAllocation<Balance, pallet_project_token::types::VestingScheduleParams<BlockNumber>>, pallet_project_token::types::TransferPolicyParams<pallet_project_token::types::WhitelistParams<primitive_types::H256, pallet_project_token::types::SingleDataObjectUploadParams<JoyBalance>>>, MemberId>
   **/
  PalletProjectTokenTokenIssuanceParameters: {
    initialAllocation: 'BTreeMap<u64, PalletProjectTokenTokenAllocation>',
    symbol: 'H256',
    transferPolicy: 'PalletProjectTokenTransferPolicyParams',
    patronageRate: 'Permill',
    revenueSplitRate: 'Permill'
  },
  /**
   * Lookup153: pallet_project_token::types::TokenAllocation<Balance, pallet_project_token::types::VestingScheduleParams<BlockNumber>>
   **/
  PalletProjectTokenTokenAllocation: {
    amount: 'u128',
    vestingScheduleParams: 'Option<PalletProjectTokenVestingScheduleParams>'
  },
  /**
   * Lookup154: pallet_project_token::types::VestingScheduleParams<BlockNumber>
   **/
  PalletProjectTokenVestingScheduleParams: {
    linearVestingDuration: 'u32',
    blocksBeforeCliff: 'u32',
    cliffAmountPercentage: 'Permill'
  },
  /**
   * Lookup157: pallet_project_token::types::TransferPolicyParams<pallet_project_token::types::WhitelistParams<primitive_types::H256, pallet_project_token::types::SingleDataObjectUploadParams<JoyBalance>>>
   **/
  PalletProjectTokenTransferPolicyParams: {
    _enum: {
      Permissionless: 'Null',
      Permissioned: 'PalletProjectTokenWhitelistParams'
    }
  },
  /**
   * Lookup158: pallet_project_token::types::WhitelistParams<primitive_types::H256, pallet_project_token::types::SingleDataObjectUploadParams<JoyBalance>>
   **/
  PalletProjectTokenWhitelistParams: {
    commitment: 'H256',
    payload: 'Option<PalletProjectTokenSingleDataObjectUploadParams>'
  },
  /**
   * Lookup159: pallet_project_token::types::SingleDataObjectUploadParams<JoyBalance>
   **/
  PalletProjectTokenSingleDataObjectUploadParams: {
    objectCreationParams: 'PalletStorageDataObjectCreationParameters',
    expectedDataSizeFee: 'u128',
    expectedDataObjectStateBloatBond: 'u128'
  },
  /**
   * Lookup166: pallet_project_token::types::Validated<MemberId>
   **/
  PalletProjectTokenValidated: {
    _enum: {
      Existing: 'u64',
      NonExisting: 'u64'
    }
  },
  /**
   * Lookup167: pallet_project_token::types::ValidatedPayment<pallet_project_token::types::PaymentWithVesting<Balance, pallet_project_token::types::VestingScheduleParams<BlockNumber>>>
   **/
  PalletProjectTokenValidatedPayment: {
    payment: 'PalletProjectTokenPaymentWithVesting',
    vestingCleanupCandidate: 'Option<PalletProjectTokenVestingSource>'
  },
  /**
   * Lookup168: pallet_project_token::types::PaymentWithVesting<Balance, pallet_project_token::types::VestingScheduleParams<BlockNumber>>
   **/
  PalletProjectTokenPaymentWithVesting: {
    remark: 'Bytes',
    amount: 'u128',
    vestingSchedule: 'Option<PalletProjectTokenVestingScheduleParams>'
  },
  /**
   * Lookup170: pallet_project_token::types::VestingSource
   **/
  PalletProjectTokenVestingSource: {
    _enum: {
      InitialIssuance: 'Null',
      Sale: 'u32',
      IssuerTransfer: 'u64'
    }
  },
  /**
   * Lookup174: pallet_project_token::types::TokenSale<JoyBalance, Balance, BlockNumber, pallet_project_token::types::VestingScheduleParams<BlockNumber>, MemberId, sp_core::crypto::AccountId32>
   **/
  PalletProjectTokenTokenSale: {
    unitPrice: 'u128',
    quantityLeft: 'u128',
    fundsCollected: 'u128',
    tokensSource: 'u64',
    earningsDestination: 'Option<AccountId32>',
    startBlock: 'u32',
    duration: 'u32',
    vestingScheduleParams: 'Option<PalletProjectTokenVestingScheduleParams>',
    capPerMember: 'Option<u128>',
    autoFinalize: 'bool'
  },
  /**
   * Lookup176: pallet_proposals_engine::RawEvent<ProposalId, MemberId, BlockNumber>
   **/
  PalletProposalsEngineRawEvent: {
    _enum: {
      ProposalStatusUpdated: '(u32,PalletProposalsEngineProposalStatusesProposalStatus)',
      ProposalDecisionMade: '(u32,PalletProposalsEngineProposalStatusesProposalDecision)',
      ProposalExecuted: '(u32,PalletProposalsEngineProposalStatusesExecutionStatus)',
      Voted: '(u64,u32,PalletProposalsEngineVoteKind,Bytes)',
      ProposalCancelled: '(u64,u32)',
      ProposerRemarked: '(u64,u32,Bytes)'
    }
  },
  /**
   * Lookup177: pallet_proposals_engine::types::proposal_statuses::ProposalStatus<BlockNumber>
   **/
  PalletProposalsEngineProposalStatusesProposalStatus: {
    _enum: {
      Active: 'Null',
      PendingExecution: 'u32',
      PendingConstitutionality: 'Null'
    }
  },
  /**
   * Lookup178: pallet_proposals_engine::types::proposal_statuses::ProposalDecision
   **/
  PalletProposalsEngineProposalStatusesProposalDecision: {
    _enum: {
      Canceled: 'Null',
      CanceledByRuntime: 'Null',
      Vetoed: 'Null',
      Rejected: 'Null',
      Slashed: 'Null',
      Expired: 'Null',
      Approved: 'PalletProposalsEngineProposalStatusesApprovedProposalDecision'
    }
  },
  /**
   * Lookup179: pallet_proposals_engine::types::proposal_statuses::ApprovedProposalDecision
   **/
  PalletProposalsEngineProposalStatusesApprovedProposalDecision: {
    _enum: ['PendingExecution', 'PendingConstitutionality']
  },
  /**
   * Lookup180: pallet_proposals_engine::types::proposal_statuses::ExecutionStatus
   **/
  PalletProposalsEngineProposalStatusesExecutionStatus: {
    _enum: {
      Executed: 'Null',
      ExecutionFailed: {
        error: 'Bytes'
      }
    }
  },
  /**
   * Lookup181: pallet_proposals_engine::types::VoteKind
   **/
  PalletProposalsEngineVoteKind: {
    _enum: ['Approve', 'Reject', 'Slash', 'Abstain']
  },
  /**
   * Lookup182: pallet_proposals_discussion::RawEvent<ThreadId, MemberId, PostId>
   **/
  PalletProposalsDiscussionRawEvent: {
    _enum: {
      ThreadCreated: '(u64,u64)',
      PostCreated: '(u64,u64,u64,Bytes,bool)',
      PostUpdated: '(u64,u64,u64,Bytes)',
      ThreadModeChanged: '(u64,PalletProposalsDiscussionThreadMode,u64)',
      PostDeleted: '(u64,u64,u64,bool)'
    }
  },
  /**
   * Lookup183: pallet_proposals_discussion::types::ThreadMode<MemberId>
   **/
  PalletProposalsDiscussionThreadMode: {
    _enum: {
      Open: 'Null',
      Closed: 'Vec<u64>'
    }
  },
  /**
   * Lookup184: pallet_proposals_codex::RawEvent<pallet_proposals_codex::types::GeneralProposalParams<MemberId, sp_core::crypto::AccountId32, BlockNumber>, pallet_proposals_codex::types::ProposalDetails<Balance, BlockNumber, sp_core::crypto::AccountId32, WorkerId, OpeningId, ProposalId, pallet_content::types::UpdateChannelPayoutsParametersRecord<pallet_content::types::ChannelPayoutsPayloadParametersRecord<sp_core::crypto::AccountId32, Balance>, Balance, primitive_types::H256>>, ProposalId, ThreadId>
   **/
  PalletProposalsCodexRawEvent: {
    _enum: {
      ProposalCreated: '(u32,PalletProposalsCodexGeneralProposalParams,PalletProposalsCodexProposalDetails,u64)'
    }
  },
  /**
   * Lookup185: pallet_proposals_codex::types::GeneralProposalParams<MemberId, sp_core::crypto::AccountId32, BlockNumber>
   **/
  PalletProposalsCodexGeneralProposalParams: {
    memberId: 'u64',
    title: 'Bytes',
    description: 'Bytes',
    stakingAccountId: 'Option<AccountId32>',
    exactExecutionBlock: 'Option<u32>'
  },
  /**
   * Lookup186: pallet_proposals_codex::types::ProposalDetails<Balance, BlockNumber, sp_core::crypto::AccountId32, WorkerId, OpeningId, ProposalId, pallet_content::types::UpdateChannelPayoutsParametersRecord<pallet_content::types::ChannelPayoutsPayloadParametersRecord<sp_core::crypto::AccountId32, Balance>, Balance, primitive_types::H256>>
   **/
  PalletProposalsCodexProposalDetails: {
    _enum: {
      Signal: 'Bytes',
      RuntimeUpgrade: 'Bytes',
      FundingRequest: 'Vec<PalletCommonFundingRequestParameters>',
      SetMaxValidatorCount: 'u32',
      CreateWorkingGroupLeadOpening: 'PalletProposalsCodexCreateOpeningParameters',
      FillWorkingGroupLeadOpening: 'PalletProposalsCodexFillOpeningParameters',
      UpdateWorkingGroupBudget: '(u128,PalletCommonWorkingGroup,PalletCommonBalanceKind)',
      DecreaseWorkingGroupLeadStake: '(u64,u128,PalletCommonWorkingGroup)',
      SlashWorkingGroupLead: '(u64,u128,PalletCommonWorkingGroup)',
      SetWorkingGroupLeadReward: '(u64,Option<u128>,PalletCommonWorkingGroup)',
      TerminateWorkingGroupLead: 'PalletProposalsCodexTerminateRoleParameters',
      AmendConstitution: 'Bytes',
      CancelWorkingGroupLeadOpening: '(u64,PalletCommonWorkingGroup)',
      SetMembershipPrice: 'u128',
      SetCouncilBudgetIncrement: 'u128',
      SetCouncilorReward: 'u128',
      SetInitialInvitationBalance: 'u128',
      SetInitialInvitationCount: 'u32',
      SetMembershipLeadInvitationQuota: 'u32',
      SetReferralCut: 'u8',
      VetoProposal: 'u32',
      UpdateGlobalNftLimit: '(PalletContentNftLimitPeriod,u64)',
      UpdateChannelPayouts: 'PalletContentUpdateChannelPayoutsParametersRecord'
    }
  },
  /**
   * Lookup188: pallet_common::FundingRequestParameters<Balance, sp_core::crypto::AccountId32>
   **/
  PalletCommonFundingRequestParameters: {
    account: 'AccountId32',
    amount: 'u128'
  },
  /**
   * Lookup189: pallet_proposals_codex::types::CreateOpeningParameters<BlockNumber, Balance>
   **/
  PalletProposalsCodexCreateOpeningParameters: {
    description: 'Bytes',
    stakePolicy: 'PalletWorkingGroupStakePolicy',
    rewardPerBlock: 'Option<u128>',
    group: 'PalletCommonWorkingGroup'
  },
  /**
   * Lookup190: pallet_working_group::types::StakePolicy<BlockNumber, Balance>
   **/
  PalletWorkingGroupStakePolicy: {
    stakeAmount: 'u128',
    leavingUnstakingPeriod: 'u32'
  },
  /**
   * Lookup191: pallet_proposals_codex::types::FillOpeningParameters
   **/
  PalletProposalsCodexFillOpeningParameters: {
    openingId: 'u64',
    applicationId: 'u64',
    workingGroup: 'PalletCommonWorkingGroup'
  },
  /**
   * Lookup192: pallet_proposals_codex::types::TerminateRoleParameters<WorkerId, Balance>
   **/
  PalletProposalsCodexTerminateRoleParameters: {
    workerId: 'u64',
    slashingAmount: 'Option<u128>',
    group: 'PalletCommonWorkingGroup'
  },
  /**
   * Lookup193: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance1>
   **/
  PalletWorkingGroupRawEventInstance1: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup197: pallet_working_group::types::OpeningType
   **/
  PalletWorkingGroupOpeningType: {
    _enum: ['Leader', 'Regular']
  },
  /**
   * Lookup198: pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>
   **/
  PalletWorkingGroupApplyOnOpeningParams: {
    memberId: 'u64',
    openingId: 'u64',
    roleAccountId: 'AccountId32',
    rewardAccountId: 'AccountId32',
    description: 'Bytes',
    stakeParameters: 'PalletWorkingGroupStakeParameters'
  },
  /**
   * Lookup199: pallet_working_group::types::StakeParameters<sp_core::crypto::AccountId32, Balance>
   **/
  PalletWorkingGroupStakeParameters: {
    stake: 'u128',
    stakingAccountId: 'AccountId32'
  },
  /**
   * Lookup200: pallet_working_group::Instance1
   **/
  PalletWorkingGroupInstance1: 'Null',
  /**
   * Lookup201: pallet_working_group::types::RewardPaymentType
   **/
  PalletWorkingGroupRewardPaymentType: {
    _enum: ['MissedReward', 'RegularReward']
  },
  /**
   * Lookup202: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance2>
   **/
  PalletWorkingGroupRawEventInstance2: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup203: pallet_working_group::Instance2
   **/
  PalletWorkingGroupInstance2: 'Null',
  /**
   * Lookup204: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance3>
   **/
  PalletWorkingGroupRawEventInstance3: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup205: pallet_working_group::Instance3
   **/
  PalletWorkingGroupInstance3: 'Null',
  /**
   * Lookup206: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance4>
   **/
  PalletWorkingGroupRawEventInstance4: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup207: pallet_working_group::Instance4
   **/
  PalletWorkingGroupInstance4: 'Null',
  /**
   * Lookup208: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance5>
   **/
  PalletWorkingGroupRawEventInstance5: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup209: pallet_working_group::Instance5
   **/
  PalletWorkingGroupInstance5: 'Null',
  /**
   * Lookup210: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance6>
   **/
  PalletWorkingGroupRawEventInstance6: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup211: pallet_working_group::Instance6
   **/
  PalletWorkingGroupInstance6: 'Null',
  /**
   * Lookup212: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance7>
   **/
  PalletWorkingGroupRawEventInstance7: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup213: pallet_working_group::Instance7
   **/
  PalletWorkingGroupInstance7: 'Null',
  /**
   * Lookup214: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance8>
   **/
  PalletWorkingGroupRawEventInstance8: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup215: pallet_working_group::Instance8
   **/
  PalletWorkingGroupInstance8: 'Null',
  /**
   * Lookup216: pallet_working_group::RawEvent<OpeningId, ApplicationId, BTreeMap<K, V>, WorkerId, sp_core::crypto::AccountId32, Balance, pallet_working_group::types::OpeningType, pallet_working_group::types::StakePolicy<BlockNumber, Balance>, pallet_working_group::types::ApplyOnOpeningParams<MemberId, OpeningId, sp_core::crypto::AccountId32, Balance>, MemberId, pallet_working_group::Instance9>
   **/
  PalletWorkingGroupRawEventInstance9: {
    _enum: {
      OpeningAdded: '(u64,Bytes,PalletWorkingGroupOpeningType,PalletWorkingGroupStakePolicy,Option<u128>)',
      AppliedOnOpening: '(PalletWorkingGroupApplyOnOpeningParams,u64)',
      OpeningFilled: '(u64,BTreeMap<u64, u64>,BTreeSet<u64>)',
      LeaderSet: 'u64',
      WorkerRoleAccountUpdated: '(u64,AccountId32)',
      LeaderUnset: 'Null',
      WorkerExited: 'u64',
      WorkerStartedLeaving: '(u64,Option<Bytes>)',
      TerminatedWorker: '(u64,Option<u128>,Option<Bytes>)',
      TerminatedLeader: '(u64,Option<u128>,Option<Bytes>)',
      StakeSlashed: '(u64,u128,u128,Option<Bytes>)',
      StakeDecreased: '(u64,u128)',
      StakeIncreased: '(u64,u128)',
      ApplicationWithdrawn: 'u64',
      OpeningCanceled: 'u64',
      BudgetSet: 'u128',
      WorkerRewardAccountUpdated: '(u64,AccountId32)',
      WorkerRewardAmountUpdated: '(u64,Option<u128>)',
      StatusTextChanged: '(Bytes,Option<Bytes>)',
      BudgetSpending: '(AccountId32,u128,Option<Bytes>)',
      RewardPaid: '(u64,AccountId32,u128,PalletWorkingGroupRewardPaymentType)',
      NewMissedRewardLevelReached: '(u64,Option<u128>)',
      WorkerStorageUpdated: '(u64,Bytes)',
      WorkingGroupBudgetFunded: '(u64,u128,Bytes)',
      LeadRemarked: 'Bytes',
      WorkerRemarked: '(u64,Bytes)'
    }
  },
  /**
   * Lookup217: pallet_working_group::Instance9
   **/
  PalletWorkingGroupInstance9: 'Null',
  /**
   * Lookup218: frame_system::Phase
   **/
  FrameSystemPhase: {
    _enum: {
      ApplyExtrinsic: 'u32',
      Finalization: 'Null',
      Initialization: 'Null'
    }
  },
  /**
   * Lookup222: frame_system::LastRuntimeUpgradeInfo
   **/
  FrameSystemLastRuntimeUpgradeInfo: {
    specVersion: 'Compact<u32>',
    specName: 'Text'
  },
  /**
   * Lookup225: frame_system::pallet::Call<T>
   **/
  FrameSystemCall: {
    _enum: {
      fill_block: {
        ratio: 'Perbill',
      },
      remark: {
        remark: 'Bytes',
      },
      set_heap_pages: {
        pages: 'u64',
      },
      set_code: {
        code: 'Bytes',
      },
      set_code_without_checks: {
        code: 'Bytes',
      },
      set_storage: {
        items: 'Vec<(Bytes,Bytes)>',
      },
      kill_storage: {
        _alias: {
          keys_: 'keys',
        },
        keys_: 'Vec<Bytes>',
      },
      kill_prefix: {
        prefix: 'Bytes',
        subkeys: 'u32',
      },
      remark_with_event: {
        remark: 'Bytes'
      }
    }
  },
  /**
   * Lookup228: frame_system::limits::BlockWeights
   **/
  FrameSystemLimitsBlockWeights: {
    baseBlock: 'u64',
    maxBlock: 'u64',
    perClass: 'FrameSupportWeightsPerDispatchClassWeightsPerClass'
  },
  /**
   * Lookup229: frame_support::weights::PerDispatchClass<frame_system::limits::WeightsPerClass>
   **/
  FrameSupportWeightsPerDispatchClassWeightsPerClass: {
    normal: 'FrameSystemLimitsWeightsPerClass',
    operational: 'FrameSystemLimitsWeightsPerClass',
    mandatory: 'FrameSystemLimitsWeightsPerClass'
  },
  /**
   * Lookup230: frame_system::limits::WeightsPerClass
   **/
  FrameSystemLimitsWeightsPerClass: {
    baseExtrinsic: 'u64',
    maxExtrinsic: 'Option<u64>',
    maxTotal: 'Option<u64>',
    reserved: 'Option<u64>'
  },
  /**
   * Lookup231: frame_system::limits::BlockLength
   **/
  FrameSystemLimitsBlockLength: {
    max: 'FrameSupportWeightsPerDispatchClassU32'
  },
  /**
   * Lookup232: frame_support::weights::PerDispatchClass<T>
   **/
  FrameSupportWeightsPerDispatchClassU32: {
    normal: 'u32',
    operational: 'u32',
    mandatory: 'u32'
  },
  /**
   * Lookup233: frame_support::weights::RuntimeDbWeight
   **/
  FrameSupportWeightsRuntimeDbWeight: {
    read: 'u64',
    write: 'u64'
  },
  /**
   * Lookup234: sp_version::RuntimeVersion
   **/
  SpVersionRuntimeVersion: {
    specName: 'Text',
    implName: 'Text',
    authoringVersion: 'u32',
    specVersion: 'u32',
    implVersion: 'u32',
    apis: 'Vec<([u8;8],u32)>',
    transactionVersion: 'u32',
    stateVersion: 'u8'
  },
  /**
   * Lookup240: frame_system::pallet::Error<T>
   **/
  FrameSystemError: {
    _enum: ['InvalidSpecName', 'SpecVersionNeedsToIncrease', 'FailedToExtractRuntimeVersion', 'NonDefaultComposite', 'NonZeroRefCount', 'CallFiltered']
  },
  /**
   * Lookup241: pallet_utility::pallet::Call<T>
   **/
  PalletUtilityCall: {
    _enum: {
      batch: {
        calls: 'Vec<Call>',
      },
      as_derivative: {
        index: 'u16',
        call: 'Call',
      },
      batch_all: {
        calls: 'Vec<Call>',
      },
      dispatch_as: {
        asOrigin: 'JoystreamNodeRuntimeOriginCaller',
        call: 'Call',
      },
      force_batch: {
        calls: 'Vec<Call>'
      }
    }
  },
  /**
   * Lookup244: pallet_babe::pallet::Call<T>
   **/
  PalletBabeCall: {
    _enum: {
      report_equivocation: {
        equivocationProof: 'SpConsensusSlotsEquivocationProof',
        keyOwnerProof: 'SpSessionMembershipProof',
      },
      report_equivocation_unsigned: {
        equivocationProof: 'SpConsensusSlotsEquivocationProof',
        keyOwnerProof: 'SpSessionMembershipProof',
      },
      plan_config_change: {
        config: 'SpConsensusBabeDigestsNextConfigDescriptor'
      }
    }
  },
  /**
   * Lookup245: sp_consensus_slots::EquivocationProof<sp_runtime::generic::header::Header<Number, sp_runtime::traits::BlakeTwo256>, sp_consensus_babe::app::Public>
   **/
  SpConsensusSlotsEquivocationProof: {
    offender: 'SpConsensusBabeAppPublic',
    slot: 'u64',
    firstHeader: 'SpRuntimeHeader',
    secondHeader: 'SpRuntimeHeader'
  },
  /**
   * Lookup246: sp_runtime::generic::header::Header<Number, sp_runtime::traits::BlakeTwo256>
   **/
  SpRuntimeHeader: {
    parentHash: 'H256',
    number: 'Compact<u32>',
    stateRoot: 'H256',
    extrinsicsRoot: 'H256',
    digest: 'SpRuntimeDigest'
  },
  /**
   * Lookup247: sp_runtime::traits::BlakeTwo256
   **/
  SpRuntimeBlakeTwo256: 'Null',
  /**
   * Lookup248: sp_consensus_babe::app::Public
   **/
  SpConsensusBabeAppPublic: 'SpCoreSr25519Public',
  /**
   * Lookup250: sp_session::MembershipProof
   **/
  SpSessionMembershipProof: {
    session: 'u32',
    trieNodes: 'Vec<Bytes>',
    validatorCount: 'u32'
  },
  /**
   * Lookup251: sp_consensus_babe::digests::NextConfigDescriptor
   **/
  SpConsensusBabeDigestsNextConfigDescriptor: {
    _enum: {
      __Unused0: 'Null',
      V1: {
        c: '(u64,u64)',
        allowedSlots: 'SpConsensusBabeAllowedSlots'
      }
    }
  },
  /**
   * Lookup252: sp_consensus_babe::AllowedSlots
   **/
  SpConsensusBabeAllowedSlots: {
    _enum: ['PrimarySlots', 'PrimaryAndSecondaryPlainSlots', 'PrimaryAndSecondaryVRFSlots']
  },
  /**
   * Lookup253: pallet_timestamp::pallet::Call<T>
   **/
  PalletTimestampCall: {
    _enum: {
      set: {
        now: 'Compact<u64>'
      }
    }
  },
  /**
   * Lookup255: pallet_authorship::pallet::Call<T>
   **/
  PalletAuthorshipCall: {
    _enum: {
      set_uncles: {
        newUncles: 'Vec<SpRuntimeHeader>'
      }
    }
  },
  /**
   * Lookup257: pallet_balances::pallet::Call<T, I>
   **/
  PalletBalancesCall: {
    _enum: {
      transfer: {
        dest: 'AccountId32',
        value: 'Compact<u128>',
      },
      set_balance: {
        who: 'AccountId32',
        newFree: 'Compact<u128>',
        newReserved: 'Compact<u128>',
      },
      force_transfer: {
        source: 'AccountId32',
        dest: 'AccountId32',
        value: 'Compact<u128>',
      },
      transfer_keep_alive: {
        dest: 'AccountId32',
        value: 'Compact<u128>',
      },
      transfer_all: {
        dest: 'AccountId32',
        keepAlive: 'bool',
      },
      force_unreserve: {
        who: 'AccountId32',
        amount: 'u128'
      }
    }
  },
  /**
   * Lookup258: pallet_election_provider_multi_phase::pallet::Call<T>
   **/
  PalletElectionProviderMultiPhaseCall: {
    _enum: {
      submit_unsigned: {
        rawSolution: 'PalletElectionProviderMultiPhaseRawSolution',
        witness: 'PalletElectionProviderMultiPhaseSolutionOrSnapshotSize',
      },
      set_minimum_untrusted_score: {
        maybeNextScore: 'Option<SpNposElectionsElectionScore>',
      },
      set_emergency_election_result: {
        supports: 'Vec<(AccountId32,SpNposElectionsSupport)>',
      },
      submit: {
        rawSolution: 'PalletElectionProviderMultiPhaseRawSolution',
      },
      governance_fallback: {
        maybeMaxVoters: 'Option<u32>',
        maybeMaxTargets: 'Option<u32>'
      }
    }
  },
  /**
   * Lookup259: pallet_election_provider_multi_phase::RawSolution<joystream_node_runtime::NposSolution16>
   **/
  PalletElectionProviderMultiPhaseRawSolution: {
    solution: 'JoystreamNodeRuntimeNposSolution16',
    score: 'SpNposElectionsElectionScore',
    round: 'u32'
  },
  /**
   * Lookup260: joystream_node_runtime::NposSolution16
   **/
  JoystreamNodeRuntimeNposSolution16: {
    votes1: 'Vec<(Compact<u32>,Compact<u16>)>',
    votes2: 'Vec<(Compact<u32>,(Compact<u16>,Compact<PerU16>),Compact<u16>)>',
    votes3: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);2],Compact<u16>)>',
    votes4: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);3],Compact<u16>)>',
    votes5: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);4],Compact<u16>)>',
    votes6: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);5],Compact<u16>)>',
    votes7: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);6],Compact<u16>)>',
    votes8: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);7],Compact<u16>)>',
    votes9: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);8],Compact<u16>)>',
    votes10: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);9],Compact<u16>)>',
    votes11: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);10],Compact<u16>)>',
    votes12: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);11],Compact<u16>)>',
    votes13: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);12],Compact<u16>)>',
    votes14: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);13],Compact<u16>)>',
    votes15: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);14],Compact<u16>)>',
    votes16: 'Vec<(Compact<u32>,[(Compact<u16>,Compact<PerU16>);15],Compact<u16>)>'
  },
  /**
   * Lookup311: sp_npos_elections::ElectionScore
   **/
  SpNposElectionsElectionScore: {
    minimalStake: 'u128',
    sumStake: 'u128',
    sumStakeSquared: 'u128'
  },
  /**
   * Lookup312: pallet_election_provider_multi_phase::SolutionOrSnapshotSize
   **/
  PalletElectionProviderMultiPhaseSolutionOrSnapshotSize: {
    voters: 'Compact<u32>',
    targets: 'Compact<u32>'
  },
  /**
   * Lookup316: sp_npos_elections::Support<sp_core::crypto::AccountId32>
   **/
  SpNposElectionsSupport: {
    total: 'u128',
    voters: 'Vec<(AccountId32,u128)>'
  },
  /**
   * Lookup319: pallet_staking::pallet::pallet::Call<T>
   **/
  PalletStakingPalletCall: {
    _enum: {
      bond: {
        controller: 'AccountId32',
        value: 'Compact<u128>',
        payee: 'PalletStakingRewardDestination',
      },
      bond_extra: {
        maxAdditional: 'Compact<u128>',
      },
      unbond: {
        value: 'Compact<u128>',
      },
      withdraw_unbonded: {
        numSlashingSpans: 'u32',
      },
      validate: {
        prefs: 'PalletStakingValidatorPrefs',
      },
      nominate: {
        targets: 'Vec<AccountId32>',
      },
      chill: 'Null',
      set_payee: {
        payee: 'PalletStakingRewardDestination',
      },
      set_controller: {
        controller: 'AccountId32',
      },
      set_validator_count: {
        _alias: {
          new_: 'new',
        },
        new_: 'Compact<u32>',
      },
      increase_validator_count: {
        additional: 'Compact<u32>',
      },
      scale_validator_count: {
        factor: 'Percent',
      },
      force_no_eras: 'Null',
      force_new_era: 'Null',
      set_invulnerables: {
        invulnerables: 'Vec<AccountId32>',
      },
      force_unstake: {
        stash: 'AccountId32',
        numSlashingSpans: 'u32',
      },
      force_new_era_always: 'Null',
      cancel_deferred_slash: {
        era: 'u32',
        slashIndices: 'Vec<u32>',
      },
      payout_stakers: {
        validatorStash: 'AccountId32',
        era: 'u32',
      },
      rebond: {
        value: 'Compact<u128>',
      },
      set_history_depth: {
        newHistoryDepth: 'Compact<u32>',
        eraItemsDeleted: 'Compact<u32>',
      },
      reap_stash: {
        stash: 'AccountId32',
        numSlashingSpans: 'u32',
      },
      kick: {
        who: 'Vec<AccountId32>',
      },
      set_staking_configs: {
        minNominatorBond: 'PalletStakingPalletConfigOpU128',
        minValidatorBond: 'PalletStakingPalletConfigOpU128',
        maxNominatorCount: 'PalletStakingPalletConfigOpU32',
        maxValidatorCount: 'PalletStakingPalletConfigOpU32',
        chillThreshold: 'PalletStakingPalletConfigOpPercent',
        minCommission: 'PalletStakingPalletConfigOpPerbill',
      },
      chill_other: {
        controller: 'AccountId32',
      },
      force_apply_min_commission: {
        validatorStash: 'AccountId32'
      }
    }
  },
  /**
   * Lookup320: pallet_staking::RewardDestination<sp_core::crypto::AccountId32>
   **/
  PalletStakingRewardDestination: {
    _enum: {
      Staked: 'Null',
      Stash: 'Null',
      Controller: 'Null',
      Account: 'AccountId32',
      None: 'Null'
    }
  },
  /**
   * Lookup324: pallet_staking::pallet::pallet::ConfigOp<T>
   **/
  PalletStakingPalletConfigOpU128: {
    _enum: {
      Noop: 'Null',
      Set: 'u128',
      Remove: 'Null'
    }
  },
  /**
   * Lookup325: pallet_staking::pallet::pallet::ConfigOp<T>
   **/
  PalletStakingPalletConfigOpU32: {
    _enum: {
      Noop: 'Null',
      Set: 'u32',
      Remove: 'Null'
    }
  },
  /**
   * Lookup326: pallet_staking::pallet::pallet::ConfigOp<sp_arithmetic::per_things::Percent>
   **/
  PalletStakingPalletConfigOpPercent: {
    _enum: {
      Noop: 'Null',
      Set: 'Percent',
      Remove: 'Null'
    }
  },
  /**
   * Lookup327: pallet_staking::pallet::pallet::ConfigOp<sp_arithmetic::per_things::Perbill>
   **/
  PalletStakingPalletConfigOpPerbill: {
    _enum: {
      Noop: 'Null',
      Set: 'Perbill',
      Remove: 'Null'
    }
  },
  /**
   * Lookup328: pallet_session::pallet::Call<T>
   **/
  PalletSessionCall: {
    _enum: {
      set_keys: {
        _alias: {
          keys_: 'keys',
        },
        keys_: 'JoystreamNodeRuntimeSessionKeys',
        proof: 'Bytes',
      },
      purge_keys: 'Null'
    }
  },
  /**
   * Lookup329: joystream_node_runtime::SessionKeys
   **/
  JoystreamNodeRuntimeSessionKeys: {
    grandpa: 'SpFinalityGrandpaAppPublic',
    babe: 'SpConsensusBabeAppPublic',
    imOnline: 'PalletImOnlineSr25519AppSr25519Public',
    authorityDiscovery: 'SpAuthorityDiscoveryAppPublic'
  },
  /**
   * Lookup330: sp_authority_discovery::app::Public
   **/
  SpAuthorityDiscoveryAppPublic: 'SpCoreSr25519Public',
  /**
   * Lookup331: pallet_grandpa::pallet::Call<T>
   **/
  PalletGrandpaCall: {
    _enum: {
      report_equivocation: {
        equivocationProof: 'SpFinalityGrandpaEquivocationProof',
        keyOwnerProof: 'SpSessionMembershipProof',
      },
      report_equivocation_unsigned: {
        equivocationProof: 'SpFinalityGrandpaEquivocationProof',
        keyOwnerProof: 'SpSessionMembershipProof',
      },
      note_stalled: {
        delay: 'u32',
        bestFinalizedBlockNumber: 'u32'
      }
    }
  },
  /**
   * Lookup332: sp_finality_grandpa::EquivocationProof<primitive_types::H256, N>
   **/
  SpFinalityGrandpaEquivocationProof: {
    setId: 'u64',
    equivocation: 'SpFinalityGrandpaEquivocation'
  },
  /**
   * Lookup333: sp_finality_grandpa::Equivocation<primitive_types::H256, N>
   **/
  SpFinalityGrandpaEquivocation: {
    _enum: {
      Prevote: 'FinalityGrandpaEquivocationPrevote',
      Precommit: 'FinalityGrandpaEquivocationPrecommit'
    }
  },
  /**
   * Lookup334: finality_grandpa::Equivocation<sp_finality_grandpa::app::Public, finality_grandpa::Prevote<primitive_types::H256, N>, sp_finality_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrevote: {
    roundNumber: 'u64',
    identity: 'SpFinalityGrandpaAppPublic',
    first: '(FinalityGrandpaPrevote,SpFinalityGrandpaAppSignature)',
    second: '(FinalityGrandpaPrevote,SpFinalityGrandpaAppSignature)'
  },
  /**
   * Lookup335: finality_grandpa::Prevote<primitive_types::H256, N>
   **/
  FinalityGrandpaPrevote: {
    targetHash: 'H256',
    targetNumber: 'u32'
  },
  /**
   * Lookup336: sp_finality_grandpa::app::Signature
   **/
  SpFinalityGrandpaAppSignature: 'SpCoreEd25519Signature',
  /**
   * Lookup337: sp_core::ed25519::Signature
   **/
  SpCoreEd25519Signature: '[u8;64]',
  /**
   * Lookup340: finality_grandpa::Equivocation<sp_finality_grandpa::app::Public, finality_grandpa::Precommit<primitive_types::H256, N>, sp_finality_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrecommit: {
    roundNumber: 'u64',
    identity: 'SpFinalityGrandpaAppPublic',
    first: '(FinalityGrandpaPrecommit,SpFinalityGrandpaAppSignature)',
    second: '(FinalityGrandpaPrecommit,SpFinalityGrandpaAppSignature)'
  },
  /**
   * Lookup341: finality_grandpa::Precommit<primitive_types::H256, N>
   **/
  FinalityGrandpaPrecommit: {
    targetHash: 'H256',
    targetNumber: 'u32'
  },
  /**
   * Lookup343: pallet_im_online::pallet::Call<T>
   **/
  PalletImOnlineCall: {
    _enum: {
      heartbeat: {
        heartbeat: 'PalletImOnlineHeartbeat',
        signature: 'PalletImOnlineSr25519AppSr25519Signature'
      }
    }
  },
  /**
   * Lookup344: pallet_im_online::Heartbeat<BlockNumber>
   **/
  PalletImOnlineHeartbeat: {
    blockNumber: 'u32',
    networkState: 'SpCoreOffchainOpaqueNetworkState',
    sessionIndex: 'u32',
    authorityIndex: 'u32',
    validatorsLen: 'u32'
  },
  /**
   * Lookup345: sp_core::offchain::OpaqueNetworkState
   **/
  SpCoreOffchainOpaqueNetworkState: {
    peerId: 'Bytes',
    externalAddresses: 'Vec<Bytes>'
  },
  /**
   * Lookup349: pallet_im_online::sr25519::app_sr25519::Signature
   **/
  PalletImOnlineSr25519AppSr25519Signature: 'SpCoreSr25519Signature',
  /**
   * Lookup350: sp_core::sr25519::Signature
   **/
  SpCoreSr25519Signature: '[u8;64]',
  /**
   * Lookup351: pallet_sudo::pallet::Call<T>
   **/
  PalletSudoCall: {
    _enum: {
      sudo: {
        call: 'Call',
      },
      sudo_unchecked_weight: {
        call: 'Call',
        weight: 'u64',
      },
      set_key: {
        _alias: {
          new_: 'new',
        },
        new_: 'AccountId32',
      },
      sudo_as: {
        who: 'AccountId32',
        call: 'Call'
      }
    }
  },
  /**
   * Lookup352: pallet_bags_list::pallet::Call<T, I>
   **/
  PalletBagsListCall: {
    _enum: {
      rebag: {
        dislocated: 'AccountId32',
      },
      put_in_front_of: {
        lighter: 'AccountId32'
      }
    }
  },
  /**
   * Lookup353: pallet_vesting::pallet::Call<T>
   **/
  PalletVestingCall: {
    _enum: {
      vest: 'Null',
      vest_other: {
        target: 'AccountId32',
      },
      vested_transfer: {
        target: 'AccountId32',
        schedule: 'PalletVestingVestingInfo',
      },
      force_vested_transfer: {
        source: 'AccountId32',
        target: 'AccountId32',
        schedule: 'PalletVestingVestingInfo',
      },
      merge_schedules: {
        schedule1Index: 'u32',
        schedule2Index: 'u32'
      }
    }
  },
  /**
   * Lookup354: pallet_vesting::vesting_info::VestingInfo<Balance, BlockNumber>
   **/
  PalletVestingVestingInfo: {
    locked: 'u128',
    perBlock: 'u128',
    startingBlock: 'u32'
  },
  /**
   * Lookup355: pallet_multisig::pallet::Call<T>
   **/
  PalletMultisigCall: {
    _enum: {
      as_multi_threshold_1: {
        otherSignatories: 'Vec<AccountId32>',
        call: 'Call',
      },
      as_multi: {
        threshold: 'u16',
        otherSignatories: 'Vec<AccountId32>',
        maybeTimepoint: 'Option<PalletMultisigTimepoint>',
        call: 'WrapperKeepOpaque<Call>',
        storeCall: 'bool',
        maxWeight: 'u64',
      },
      approve_as_multi: {
        threshold: 'u16',
        otherSignatories: 'Vec<AccountId32>',
        maybeTimepoint: 'Option<PalletMultisigTimepoint>',
        callHash: '[u8;32]',
        maxWeight: 'u64',
      },
      cancel_as_multi: {
        threshold: 'u16',
        otherSignatories: 'Vec<AccountId32>',
        timepoint: 'PalletMultisigTimepoint',
        callHash: '[u8;32]'
      }
    }
  },
  /**
   * Lookup358: pallet_council::Call<T>
   **/
  PalletCouncilCall: {
    _enum: {
      announce_candidacy: {
        membershipId: 'u64',
        stakingAccountId: 'AccountId32',
        rewardAccountId: 'AccountId32',
        stake: 'u128',
      },
      release_candidacy_stake: {
        membershipId: 'u64',
      },
      withdraw_candidacy: {
        membershipId: 'u64',
      },
      set_candidacy_note: {
        membershipId: 'u64',
        note: 'Bytes',
      },
      set_budget: {
        balance: 'u128',
      },
      plan_budget_refill: {
        nextRefill: 'u32',
      },
      set_budget_increment: {
        budgetIncrement: 'u128',
      },
      set_councilor_reward: {
        councilorReward: 'u128',
      },
      funding_request: {
        fundingRequests: 'Vec<PalletCommonFundingRequestParameters>',
      },
      fund_council_budget: {
        memberId: 'u64',
        amount: 'u128',
        rationale: 'Bytes',
      },
      councilor_remark: {
        councilorId: 'u64',
        msg: 'Bytes',
      },
      candidate_remark: {
        candidateId: 'u64',
        msg: 'Bytes'
      }
    }
  },
  /**
   * Lookup359: pallet_referendum::Call<T, I>
   **/
  PalletReferendumCall: {
    _enum: {
      vote: {
        commitment: 'H256',
        stake: 'u128',
      },
      reveal_vote: {
        salt: 'Bytes',
        voteOptionId: 'u64',
      },
      release_vote_stake: 'Null'
    }
  },
  /**
   * Lookup360: pallet_membership::Call<T>
   **/
  PalletMembershipCall: {
    _enum: {
      buy_membership: {
        params: 'PalletMembershipBuyMembershipParameters',
      },
      update_profile: {
        memberId: 'u64',
        handle: 'Option<Bytes>',
        metadata: 'Option<Bytes>',
      },
      update_accounts: {
        memberId: 'u64',
        newRootAccount: 'Option<AccountId32>',
        newControllerAccount: 'Option<AccountId32>',
      },
      update_profile_verification: {
        workerId: 'u64',
        targetMemberId: 'u64',
        isVerified: 'bool',
      },
      set_referral_cut: {
        percentValue: 'u8',
      },
      transfer_invites: {
        sourceMemberId: 'u64',
        targetMemberId: 'u64',
        numberOfInvites: 'u32',
      },
      invite_member: {
        params: 'PalletMembershipInviteMembershipParameters',
      },
      gift_membership: {
        params: 'PalletMembershipGiftMembershipParameters',
      },
      set_membership_price: {
        newPrice: 'u128',
      },
      set_leader_invitation_quota: {
        invitationQuota: 'u32',
      },
      set_initial_invitation_balance: {
        newInitialBalance: 'u128',
      },
      set_initial_invitation_count: {
        newInvitationCount: 'u32',
      },
      add_staking_account_candidate: {
        memberId: 'u64',
      },
      remove_staking_account: {
        memberId: 'u64',
      },
      confirm_staking_account: {
        memberId: 'u64',
        stakingAccountId: 'AccountId32',
      },
      member_remark: {
        memberId: 'u64',
        msg: 'Bytes',
      },
      create_founding_member: {
        params: 'PalletMembershipCreateFoundingMemberParameters'
      }
    }
  },
  /**
   * Lookup361: pallet_forum::Call<T>
   **/
  PalletForumCall: {
    _enum: {
      update_category_membership_of_moderator: {
        moderatorId: 'u64',
        categoryId: 'u64',
        newValue: 'bool',
      },
      create_category: {
        parentCategoryId: 'Option<u64>',
        title: 'Bytes',
        description: 'Bytes',
      },
      update_category_archival_status: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
        newArchivalStatus: 'bool',
      },
      update_category_title: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
        title: 'Bytes',
      },
      update_category_description: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
        description: 'Bytes',
      },
      delete_category: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
      },
      create_thread: {
        forumUserId: 'u64',
        categoryId: 'u64',
        metadata: 'Bytes',
        text: 'Bytes',
      },
      edit_thread_metadata: {
        forumUserId: 'u64',
        categoryId: 'u64',
        threadId: 'u64',
        newMetadata: 'Bytes',
      },
      delete_thread: {
        forumUserId: 'u64',
        categoryId: 'u64',
        threadId: 'u64',
        hide: 'bool',
      },
      move_thread_to_category: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
        threadId: 'u64',
        newCategoryId: 'u64',
      },
      moderate_thread: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
        threadId: 'u64',
        rationale: 'Bytes',
      },
      add_post: {
        forumUserId: 'u64',
        categoryId: 'u64',
        threadId: 'u64',
        text: 'Bytes',
        editable: 'bool',
      },
      react_post: {
        forumUserId: 'u64',
        categoryId: 'u64',
        threadId: 'u64',
        postId: 'u64',
        react: 'u64',
      },
      edit_post_text: {
        forumUserId: 'u64',
        categoryId: 'u64',
        threadId: 'u64',
        postId: 'u64',
        newText: 'Bytes',
      },
      moderate_post: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
        threadId: 'u64',
        postId: 'u64',
        rationale: 'Bytes',
      },
      delete_posts: {
        forumUserId: 'u64',
        posts: 'BTreeMap<PalletForumExtendedPostIdObject, bool>',
        rationale: 'Bytes',
      },
      set_stickied_threads: {
        actor: 'PalletForumPrivilegedActor',
        categoryId: 'u64',
        stickiedIds: 'Vec<u64>'
      }
    }
  },
  /**
   * Lookup362: pallet_constitution::Call<T>
   **/
  PalletConstitutionCall: {
    _enum: {
      amend_constitution: {
        constitutionText: 'Bytes'
      }
    }
  },
  /**
   * Lookup364: pallet_content::Call<T>
   **/
  PalletContentCall: {
    _enum: {
      create_curator_group: {
        isActive: 'bool',
        permissionsByLevel: 'BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupContentModerationAction>>',
      },
      update_curator_group_permissions: {
        curatorGroupId: 'u64',
        permissionsByLevel: 'BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupContentModerationAction>>',
      },
      set_curator_group_status: {
        curatorGroupId: 'u64',
        isActive: 'bool',
      },
      add_curator_to_group: {
        curatorGroupId: 'u64',
        curatorId: 'u64',
        permissions: 'BTreeSet<PalletContentChannelActionPermission>',
      },
      remove_curator_from_group: {
        curatorGroupId: 'u64',
        curatorId: 'u64',
      },
      create_channel: {
        channelOwner: 'PalletContentChannelOwner',
        params: 'PalletContentChannelCreationParametersRecord',
      },
      update_channel: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        params: 'PalletContentChannelUpdateParametersRecord',
      },
      update_channel_privilege_level: {
        channelId: 'u64',
        newPrivilegeLevel: 'u8',
      },
      set_channel_paused_features_as_moderator: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        newPausedFeatures: 'BTreeSet<PalletContentPermissionsCuratorGroupPausableChannelFeature>',
        rationale: 'Bytes',
      },
      delete_channel: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        numObjectsToDelete: 'u64',
      },
      delete_channel_assets_as_moderator: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        assetsToRemove: 'BTreeSet<u64>',
        rationale: 'Bytes',
      },
      delete_channel_as_moderator: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        numObjectsToDelete: 'u64',
        rationale: 'Bytes',
      },
      set_channel_visibility_as_moderator: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        isHidden: 'bool',
        rationale: 'Bytes',
      },
      create_video: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        params: 'PalletContentVideoCreationParametersRecord',
      },
      update_video: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        params: 'PalletContentVideoUpdateParametersRecord',
      },
      delete_video: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        numObjectsToDelete: 'u64',
      },
      delete_video_assets_as_moderator: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        assetsToRemove: 'BTreeSet<u64>',
        rationale: 'Bytes',
      },
      delete_video_as_moderator: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        numObjectsToDelete: 'u64',
        rationale: 'Bytes',
      },
      set_video_visibility_as_moderator: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        isHidden: 'bool',
        rationale: 'Bytes',
      },
      update_channel_payouts: {
        params: 'PalletContentUpdateChannelPayoutsParametersRecord',
      },
      claim_channel_reward: {
        actor: 'PalletContentPermissionsContentActor',
        proof: 'Vec<PalletContentProofElementRecord>',
        item: 'PalletContentPullPaymentElement',
      },
      withdraw_from_channel_balance: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        amount: 'u128',
      },
      update_channel_state_bloat_bond: {
        newChannelStateBloatBond: 'u128',
      },
      update_video_state_bloat_bond: {
        newVideoStateBloatBond: 'u128',
      },
      claim_and_withdraw_channel_reward: {
        actor: 'PalletContentPermissionsContentActor',
        proof: 'Vec<PalletContentProofElementRecord>',
        item: 'PalletContentPullPaymentElement',
      },
      issue_nft: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        params: 'PalletContentNftTypesNftIssuanceParametersRecord',
      },
      destroy_nft: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
      },
      start_open_auction: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        auctionParams: 'PalletContentNftTypesOpenAuctionParamsRecord',
      },
      start_english_auction: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        auctionParams: 'PalletContentNftTypesEnglishAuctionParamsRecord',
      },
      cancel_english_auction: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
      },
      cancel_open_auction: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
      },
      cancel_offer: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
      },
      cancel_buy_now: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
      },
      update_buy_now_price: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        newPrice: 'u128',
      },
      make_open_auction_bid: {
        participantId: 'u64',
        videoId: 'u64',
        bidAmount: 'u128',
      },
      make_english_auction_bid: {
        participantId: 'u64',
        videoId: 'u64',
        bidAmount: 'u128',
      },
      cancel_open_auction_bid: {
        participantId: 'u64',
        videoId: 'u64',
      },
      settle_english_auction: {
        videoId: 'u64',
      },
      pick_open_auction_winner: {
        ownerId: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        winnerId: 'u64',
        commit: 'u128',
      },
      offer_nft: {
        videoId: 'u64',
        ownerId: 'PalletContentPermissionsContentActor',
        to: 'u64',
        price: 'Option<u128>',
      },
      sling_nft_back: {
        videoId: 'u64',
        ownerId: 'PalletContentPermissionsContentActor',
      },
      accept_incoming_offer: {
        videoId: 'u64',
        witnessPrice: 'Option<u128>',
      },
      sell_nft: {
        videoId: 'u64',
        ownerId: 'PalletContentPermissionsContentActor',
        price: 'u128',
      },
      buy_nft: {
        videoId: 'u64',
        participantId: 'u64',
        witnessPrice: 'u128',
      },
      toggle_nft_limits: {
        enabled: 'bool',
      },
      channel_owner_remark: {
        channelId: 'u64',
        msg: 'Bytes',
      },
      channel_agent_remark: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        msg: 'Bytes',
      },
      nft_owner_remark: {
        actor: 'PalletContentPermissionsContentActor',
        videoId: 'u64',
        msg: 'Bytes',
      },
      initialize_channel_transfer: {
        channelId: 'u64',
        actor: 'PalletContentPermissionsContentActor',
        transferParams: 'PalletContentInitTransferParameters',
      },
      cancel_channel_transfer: {
        channelId: 'u64',
        actor: 'PalletContentPermissionsContentActor',
      },
      accept_channel_transfer: {
        channelId: 'u64',
        commitmentParams: 'PalletContentTransferCommitmentParameters',
      },
      update_global_nft_limit: {
        nftLimitPeriod: 'PalletContentNftLimitPeriod',
        limit: 'u64',
      },
      update_channel_nft_limit: {
        actor: 'PalletContentPermissionsContentActor',
        nftLimitPeriod: 'PalletContentNftLimitPeriod',
        channelId: 'u64',
        limit: 'u64',
      },
      issue_creator_token: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        params: 'PalletProjectTokenTokenIssuanceParameters',
      },
      init_creator_token_sale: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        params: 'PalletProjectTokenTokenSaleParams',
      },
      update_upcoming_creator_token_sale: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        newStartBlock: 'Option<u32>',
        newDuration: 'Option<u32>',
      },
      creator_token_issuer_transfer: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        outputs: 'PalletProjectTokenTransfersPaymentWithVesting',
      },
      make_creator_token_permissionless: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
      },
      reduce_creator_token_patronage_rate_to: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        targetRate: 'Permill',
      },
      claim_creator_token_patronage_credit: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
      },
      issue_revenue_split: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
        start: 'Option<u32>',
        duration: 'u32',
      },
      finalize_revenue_split: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
      },
      finalize_creator_token_sale: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64',
      },
      deissue_creator_token: {
        actor: 'PalletContentPermissionsContentActor',
        channelId: 'u64'
      }
    }
  },
  /**
   * Lookup366: pallet_content::types::ProofElementRecord<primitive_types::H256, pallet_content::types::Side>
   **/
  PalletContentProofElementRecord: {
    _alias: {
      hash_: 'hash'
    },
    hash_: 'H256',
    side: 'PalletContentSide'
  },
  /**
   * Lookup367: pallet_content::types::Side
   **/
  PalletContentSide: {
    _enum: ['Left', 'Right']
  },
  /**
   * Lookup368: pallet_content::types::PullPaymentElement<ChannelId, Balance, primitive_types::H256>
   **/
  PalletContentPullPaymentElement: {
    channelId: 'u64',
    cumulativeRewardEarned: 'u128',
    reason: 'H256'
  },
  /**
   * Lookup369: pallet_content::types::InitTransferParameters<MemberId, CuratorGroupId, Balance>
   **/
  PalletContentInitTransferParameters: {
    newCollaborators: 'BTreeMap<u64, BTreeSet<PalletContentChannelActionPermission>>',
    price: 'u128',
    newOwner: 'PalletContentChannelOwner'
  },
  /**
   * Lookup370: pallet_project_token::types::TokenSaleParams<JoyBalance, Balance, BlockNumber, pallet_project_token::types::VestingScheduleParams<BlockNumber>>
   **/
  PalletProjectTokenTokenSaleParams: {
    unitPrice: 'u128',
    upperBoundQuantity: 'u128',
    startsAt: 'Option<u32>',
    duration: 'u32',
    vestingScheduleParams: 'Option<PalletProjectTokenVestingScheduleParams>',
    capPerMember: 'Option<u128>',
    metadata: 'Option<Bytes>'
  },
  /**
   * Lookup371: pallet_project_token::types::Transfers<MemberId, pallet_project_token::types::PaymentWithVesting<Balance, pallet_project_token::types::VestingScheduleParams<BlockNumber>>>
   **/
  PalletProjectTokenTransfersPaymentWithVesting: 'BTreeMap<u64, PalletProjectTokenPaymentWithVesting>',
  /**
   * Lookup375: pallet_storage::Call<T>
   **/
  PalletStorageCall: {
    _enum: {
      delete_storage_bucket: {
        storageBucketId: 'u64',
      },
      update_uploading_blocked_status: {
        newStatus: 'bool',
      },
      update_data_size_fee: {
        newDataSizeFee: 'u128',
      },
      update_storage_buckets_per_bag_limit: {
        newLimit: 'u64',
      },
      update_storage_buckets_voucher_max_limits: {
        newObjectsSize: 'u64',
        newObjectsNumber: 'u64',
      },
      update_data_object_state_bloat_bond: {
        stateBloatBond: 'u128',
      },
      update_number_of_storage_buckets_in_dynamic_bag_creation_policy: {
        dynamicBagType: 'PalletStorageDynamicBagType',
        numberOfStorageBuckets: 'u64',
      },
      update_blacklist: {
        removeHashes: 'BTreeSet<Bytes>',
        addHashes: 'BTreeSet<Bytes>',
      },
      create_storage_bucket: {
        inviteWorker: 'Option<u64>',
        acceptingNewBags: 'bool',
        sizeLimit: 'u64',
        objectsLimit: 'u64',
      },
      update_storage_buckets_for_bag: {
        bagId: 'PalletStorageBagIdType',
        addBuckets: 'BTreeSet<u64>',
        removeBuckets: 'BTreeSet<u64>',
      },
      cancel_storage_bucket_operator_invite: {
        storageBucketId: 'u64',
      },
      invite_storage_bucket_operator: {
        storageBucketId: 'u64',
        operatorId: 'u64',
      },
      remove_storage_bucket_operator: {
        storageBucketId: 'u64',
      },
      update_storage_bucket_status: {
        storageBucketId: 'u64',
        acceptingNewBags: 'bool',
      },
      set_storage_bucket_voucher_limits: {
        storageBucketId: 'u64',
        newObjectsSizeLimit: 'u64',
        newObjectsNumberLimit: 'u64',
      },
      accept_storage_bucket_invitation: {
        workerId: 'u64',
        storageBucketId: 'u64',
        transactorAccountId: 'AccountId32',
      },
      set_storage_operator_metadata: {
        workerId: 'u64',
        storageBucketId: 'u64',
        metadata: 'Bytes',
      },
      accept_pending_data_objects: {
        workerId: 'u64',
        storageBucketId: 'u64',
        bagId: 'PalletStorageBagIdType',
        dataObjects: 'BTreeSet<u64>',
      },
      create_distribution_bucket_family: 'Null',
      delete_distribution_bucket_family: {
        familyId: 'u64',
      },
      create_distribution_bucket: {
        familyId: 'u64',
        acceptingNewBags: 'bool',
      },
      update_distribution_bucket_status: {
        bucketId: 'PalletStorageDistributionBucketIdRecord',
        acceptingNewBags: 'bool',
      },
      delete_distribution_bucket: {
        bucketId: 'PalletStorageDistributionBucketIdRecord',
      },
      update_distribution_buckets_for_bag: {
        bagId: 'PalletStorageBagIdType',
        familyId: 'u64',
        addBucketsIndices: 'BTreeSet<u64>',
        removeBucketsIndices: 'BTreeSet<u64>',
      },
      update_distribution_buckets_per_bag_limit: {
        newLimit: 'u64',
      },
      update_distribution_bucket_mode: {
        bucketId: 'PalletStorageDistributionBucketIdRecord',
        distributing: 'bool',
      },
      update_families_in_dynamic_bag_creation_policy: {
        dynamicBagType: 'PalletStorageDynamicBagType',
        families: 'BTreeMap<u64, u32>',
      },
      invite_distribution_bucket_operator: {
        bucketId: 'PalletStorageDistributionBucketIdRecord',
        operatorWorkerId: 'u64',
      },
      cancel_distribution_bucket_operator_invite: {
        bucketId: 'PalletStorageDistributionBucketIdRecord',
        operatorWorkerId: 'u64',
      },
      remove_distribution_bucket_operator: {
        bucketId: 'PalletStorageDistributionBucketIdRecord',
        operatorWorkerId: 'u64',
      },
      set_distribution_bucket_family_metadata: {
        familyId: 'u64',
        metadata: 'Bytes',
      },
      accept_distribution_bucket_invitation: {
        workerId: 'u64',
        bucketId: 'PalletStorageDistributionBucketIdRecord',
      },
      set_distribution_operator_metadata: {
        workerId: 'u64',
        bucketId: 'PalletStorageDistributionBucketIdRecord',
        metadata: 'Bytes',
      },
      sudo_upload_data_objects: {
        params: 'PalletStorageUploadParametersRecord',
      },
      sudo_create_dynamic_bag: {
        params: 'PalletStorageDynBagCreationParametersRecord',
      },
      storage_operator_remark: {
        workerId: 'u64',
        storageBucketId: 'u64',
        msg: 'Bytes',
      },
      distribution_operator_remark: {
        workerId: 'u64',
        distributionBucketId: 'PalletStorageDistributionBucketIdRecord',
        msg: 'Bytes'
      }
    }
  },
  /**
   * Lookup376: pallet_storage::DynBagCreationParametersRecord<pallet_storage::DynamicBagIdType<MemberId, ChannelId>, sp_core::crypto::AccountId32, Balance, StorageBucketId, pallet_storage::DistributionBucketIdRecord<DistributionBucketFamilyId, DistributionBucketIndex>>
   **/
  PalletStorageDynBagCreationParametersRecord: {
    bagId: 'PalletStorageDynamicBagIdType',
    objectCreationList: 'Vec<PalletStorageDataObjectCreationParameters>',
    stateBloatBondSourceAccountId: 'AccountId32',
    expectedDataSizeFee: 'u128',
    expectedDataObjectStateBloatBond: 'u128',
    storageBuckets: 'BTreeSet<u64>',
    distributionBuckets: 'BTreeSet<PalletStorageDistributionBucketIdRecord>'
  },
  /**
   * Lookup377: pallet_project_token::Call<T>
   **/
  PalletProjectTokenCall: {
    _enum: {
      transfer: {
        srcMemberId: 'u64',
        tokenId: 'u64',
        outputs: 'PalletProjectTokenTransfersPayment',
      },
      burn: {
        tokenId: 'u64',
        memberId: 'u64',
        amount: 'u128',
      },
      dust_account: {
        tokenId: 'u64',
        memberId: 'u64',
      },
      join_whitelist: {
        memberId: 'u64',
        tokenId: 'u64',
        proof: 'PalletProjectTokenMerkleProof',
      },
      purchase_tokens_on_sale: {
        tokenId: 'u64',
        memberId: 'u64',
        amount: 'u128',
      },
      participate_in_split: {
        tokenId: 'u64',
        memberId: 'u64',
        amount: 'u128',
      },
      exit_revenue_split: {
        tokenId: 'u64',
        memberId: 'u64'
      }
    }
  },
  /**
   * Lookup378: pallet_project_token::types::Transfers<MemberId, pallet_project_token::types::Payment<Balance>>
   **/
  PalletProjectTokenTransfersPayment: 'BTreeMap<u64, PalletProjectTokenPayment>',
  /**
   * Lookup379: pallet_project_token::types::Payment<Balance>
   **/
  PalletProjectTokenPayment: {
    remark: 'Bytes',
    amount: 'u128'
  },
  /**
   * Lookup383: pallet_project_token::types::MerkleProof<sp_runtime::traits::BlakeTwo256>
   **/
  PalletProjectTokenMerkleProof: 'Vec<(H256,PalletProjectTokenMerkleSide)>',
  /**
   * Lookup386: pallet_project_token::types::MerkleSide
   **/
  PalletProjectTokenMerkleSide: {
    _enum: ['Right', 'Left']
  },
  /**
   * Lookup387: pallet_proposals_engine::Call<T>
   **/
  PalletProposalsEngineCall: {
    _enum: {
      vote: {
        voterId: 'u64',
        proposalId: 'u32',
        vote: 'PalletProposalsEngineVoteKind',
        rationale: 'Bytes',
      },
      cancel_proposal: {
        proposerId: 'u64',
        proposalId: 'u32',
      },
      veto_proposal: {
        proposalId: 'u32',
      },
      proposer_remark: {
        proposalId: 'u32',
        proposerId: 'u64',
        msg: 'Bytes'
      }
    }
  },
  /**
   * Lookup388: pallet_proposals_discussion::Call<T>
   **/
  PalletProposalsDiscussionCall: {
    _enum: {
      add_post: {
        postAuthorId: 'u64',
        threadId: 'u64',
        text: 'Bytes',
        editable: 'bool',
      },
      delete_post: {
        deleterId: 'u64',
        postId: 'u64',
        threadId: 'u64',
        hide: 'bool',
      },
      update_post: {
        threadId: 'u64',
        postId: 'u64',
        text: 'Bytes',
      },
      change_thread_mode: {
        memberId: 'u64',
        threadId: 'u64',
        mode: 'PalletProposalsDiscussionThreadMode'
      }
    }
  },
  /**
   * Lookup389: pallet_proposals_codex::Call<T>
   **/
  PalletProposalsCodexCall: {
    _enum: {
      create_proposal: {
        generalProposalParameters: 'PalletProposalsCodexGeneralProposalParams',
        proposalDetails: 'PalletProposalsCodexProposalDetails'
      }
    }
  },
  /**
   * Lookup390: pallet_working_group::Call<T, I>
   **/
  PalletWorkingGroupCall: {
    _enum: {
      add_opening: {
        description: 'Bytes',
        openingType: 'PalletWorkingGroupOpeningType',
        stakePolicy: 'PalletWorkingGroupStakePolicy',
        rewardPerBlock: 'Option<u128>',
      },
      apply_on_opening: {
        p: 'PalletWorkingGroupApplyOnOpeningParams',
      },
      fill_opening: {
        openingId: 'u64',
        successfulApplicationIds: 'BTreeSet<u64>',
      },
      update_role_account: {
        workerId: 'u64',
        newRoleAccountId: 'AccountId32',
      },
      leave_role: {
        workerId: 'u64',
        rationale: 'Option<Bytes>',
      },
      terminate_role: {
        workerId: 'u64',
        penalty: 'Option<u128>',
        rationale: 'Option<Bytes>',
      },
      slash_stake: {
        workerId: 'u64',
        penalty: 'u128',
        rationale: 'Option<Bytes>',
      },
      decrease_stake: {
        workerId: 'u64',
        stakeBalanceDelta: 'u128',
      },
      increase_stake: {
        workerId: 'u64',
        stakeBalanceDelta: 'u128',
      },
      withdraw_application: {
        applicationId: 'u64',
      },
      cancel_opening: {
        openingId: 'u64',
      },
      set_budget: {
        newBudget: 'u128',
      },
      update_reward_account: {
        workerId: 'u64',
        newRewardAccountId: 'AccountId32',
      },
      update_reward_amount: {
        workerId: 'u64',
        rewardPerBlock: 'Option<u128>',
      },
      set_status_text: {
        statusText: 'Option<Bytes>',
      },
      spend_from_budget: {
        accountId: 'AccountId32',
        amount: 'u128',
        rationale: 'Option<Bytes>',
      },
      update_role_storage: {
        workerId: 'u64',
        storage: 'Bytes',
      },
      fund_working_group_budget: {
        memberId: 'u64',
        amount: 'u128',
        rationale: 'Bytes',
      },
      lead_remark: {
        msg: 'Bytes',
      },
      worker_remark: {
        workerId: 'u64',
        msg: 'Bytes'
      }
    }
  },
  /**
   * Lookup399: joystream_node_runtime::OriginCaller
   **/
  JoystreamNodeRuntimeOriginCaller: {
    _enum: {
      system: 'FrameSupportDispatchRawOrigin',
      Void: 'SpCoreVoid'
    }
  },
  /**
   * Lookup400: frame_support::dispatch::RawOrigin<sp_core::crypto::AccountId32>
   **/
  FrameSupportDispatchRawOrigin: {
    _enum: {
      Root: 'Null',
      Signed: 'AccountId32',
      None: 'Null'
    }
  },
  /**
   * Lookup401: sp_core::Void
   **/
  SpCoreVoid: 'Null',
  /**
   * Lookup402: pallet_utility::pallet::Error<T>
   **/
  PalletUtilityError: {
    _enum: ['TooManyCalls']
  },
  /**
   * Lookup409: sp_consensus_babe::digests::PreDigest
   **/
  SpConsensusBabeDigestsPreDigest: {
    _enum: {
      __Unused0: 'Null',
      Primary: 'SpConsensusBabeDigestsPrimaryPreDigest',
      SecondaryPlain: 'SpConsensusBabeDigestsSecondaryPlainPreDigest',
      SecondaryVRF: 'SpConsensusBabeDigestsSecondaryVRFPreDigest'
    }
  },
  /**
   * Lookup410: sp_consensus_babe::digests::PrimaryPreDigest
   **/
  SpConsensusBabeDigestsPrimaryPreDigest: {
    authorityIndex: 'u32',
    slot: 'u64',
    vrfOutput: '[u8;32]',
    vrfProof: '[u8;64]'
  },
  /**
   * Lookup411: sp_consensus_babe::digests::SecondaryPlainPreDigest
   **/
  SpConsensusBabeDigestsSecondaryPlainPreDigest: {
    authorityIndex: 'u32',
    slot: 'u64'
  },
  /**
   * Lookup412: sp_consensus_babe::digests::SecondaryVRFPreDigest
   **/
  SpConsensusBabeDigestsSecondaryVRFPreDigest: {
    authorityIndex: 'u32',
    slot: 'u64',
    vrfOutput: '[u8;32]',
    vrfProof: '[u8;64]'
  },
  /**
   * Lookup414: sp_consensus_babe::BabeEpochConfiguration
   **/
  SpConsensusBabeBabeEpochConfiguration: {
    c: '(u64,u64)',
    allowedSlots: 'SpConsensusBabeAllowedSlots'
  },
  /**
   * Lookup415: pallet_babe::pallet::Error<T>
   **/
  PalletBabeError: {
    _enum: ['InvalidEquivocationProof', 'InvalidKeyOwnershipProof', 'DuplicateOffenceReport', 'InvalidConfiguration']
  },
  /**
   * Lookup417: pallet_authorship::UncleEntryItem<BlockNumber, primitive_types::H256, sp_core::crypto::AccountId32>
   **/
  PalletAuthorshipUncleEntryItem: {
    _enum: {
      InclusionHeight: 'u32',
      Uncle: '(H256,Option<AccountId32>)'
    }
  },
  /**
   * Lookup418: pallet_authorship::pallet::Error<T>
   **/
  PalletAuthorshipError: {
    _enum: ['InvalidUncleParent', 'UnclesAlreadySet', 'TooManyUncles', 'GenesisUncle', 'TooHighUncle', 'UncleAlreadyIncluded', 'OldUncle']
  },
  /**
   * Lookup420: pallet_balances::BalanceLock<Balance>
   **/
  PalletBalancesBalanceLock: {
    id: '[u8;8]',
    amount: 'u128',
    reasons: 'PalletBalancesReasons'
  },
  /**
   * Lookup421: pallet_balances::Reasons
   **/
  PalletBalancesReasons: {
    _enum: ['Fee', 'Misc', 'All']
  },
  /**
   * Lookup424: pallet_balances::ReserveData<ReserveIdentifier, Balance>
   **/
  PalletBalancesReserveData: {
    id: '[u8;8]',
    amount: 'u128'
  },
  /**
   * Lookup426: pallet_balances::Releases
   **/
  PalletBalancesReleases: {
    _enum: ['V1_0_0', 'V2_0_0']
  },
  /**
   * Lookup427: pallet_balances::pallet::Error<T, I>
   **/
  PalletBalancesError: {
    _enum: ['VestingBalance', 'LiquidityRestrictions', 'InsufficientBalance', 'ExistentialDeposit', 'KeepAlive', 'ExistingVestingSchedule', 'DeadAccount', 'TooManyReserves']
  },
  /**
   * Lookup429: pallet_transaction_payment::Releases
   **/
  PalletTransactionPaymentReleases: {
    _enum: ['V1Ancient', 'V2']
  },
  /**
   * Lookup430: pallet_election_provider_multi_phase::Phase<Bn>
   **/
  PalletElectionProviderMultiPhasePhase: {
    _enum: {
      Off: 'Null',
      Signed: 'Null',
      Unsigned: '(bool,u32)',
      Emergency: 'Null'
    }
  },
  /**
   * Lookup432: pallet_election_provider_multi_phase::ReadySolution<sp_core::crypto::AccountId32>
   **/
  PalletElectionProviderMultiPhaseReadySolution: {
    supports: 'Vec<(AccountId32,SpNposElectionsSupport)>',
    score: 'SpNposElectionsElectionScore',
    compute: 'PalletElectionProviderMultiPhaseElectionCompute'
  },
  /**
   * Lookup433: pallet_election_provider_multi_phase::RoundSnapshot<T>
   **/
  PalletElectionProviderMultiPhaseRoundSnapshot: {
    voters: 'Vec<(AccountId32,u64,Vec<AccountId32>)>',
    targets: 'Vec<AccountId32>'
  },
  /**
   * Lookup441: pallet_election_provider_multi_phase::signed::SignedSubmission<sp_core::crypto::AccountId32, Balance, joystream_node_runtime::NposSolution16>
   **/
  PalletElectionProviderMultiPhaseSignedSignedSubmission: {
    who: 'AccountId32',
    deposit: 'u128',
    rawSolution: 'PalletElectionProviderMultiPhaseRawSolution',
    callFee: 'u128'
  },
  /**
   * Lookup442: pallet_election_provider_multi_phase::pallet::Error<T>
   **/
  PalletElectionProviderMultiPhaseError: {
    _enum: ['PreDispatchEarlySubmission', 'PreDispatchWrongWinnerCount', 'PreDispatchWeakSubmission', 'SignedQueueFull', 'SignedCannotPayDeposit', 'SignedInvalidWitness', 'SignedTooMuchWeight', 'OcwCallWrongEra', 'MissingSnapshotMetadata', 'InvalidSubmissionIndex', 'CallNotAllowed', 'FallbackFailed']
  },
  /**
   * Lookup443: pallet_staking::StakingLedger<T>
   **/
  PalletStakingStakingLedger: {
    stash: 'AccountId32',
    total: 'Compact<u128>',
    active: 'Compact<u128>',
    unlocking: 'Vec<PalletStakingUnlockChunk>',
    claimedRewards: 'Vec<u32>'
  },
  /**
   * Lookup445: pallet_staking::UnlockChunk<Balance>
   **/
  PalletStakingUnlockChunk: {
    value: 'Compact<u128>',
    era: 'Compact<u32>'
  },
  /**
   * Lookup447: pallet_staking::Nominations<T>
   **/
  PalletStakingNominations: {
    targets: 'Vec<AccountId32>',
    submittedIn: 'u32',
    suppressed: 'bool'
  },
  /**
   * Lookup448: pallet_staking::ActiveEraInfo
   **/
  PalletStakingActiveEraInfo: {
    index: 'u32',
    start: 'Option<u64>'
  },
  /**
   * Lookup450: pallet_staking::EraRewardPoints<sp_core::crypto::AccountId32>
   **/
  PalletStakingEraRewardPoints: {
    total: 'u32',
    individual: 'BTreeMap<AccountId32, u32>'
  },
  /**
   * Lookup454: pallet_staking::Forcing
   **/
  PalletStakingForcing: {
    _enum: ['NotForcing', 'ForceNew', 'ForceNone', 'ForceAlways']
  },
  /**
   * Lookup456: pallet_staking::UnappliedSlash<sp_core::crypto::AccountId32, Balance>
   **/
  PalletStakingUnappliedSlash: {
    validator: 'AccountId32',
    own: 'u128',
    others: 'Vec<(AccountId32,u128)>',
    reporters: 'Vec<AccountId32>',
    payout: 'u128'
  },
  /**
   * Lookup458: pallet_staking::slashing::SlashingSpans
   **/
  PalletStakingSlashingSlashingSpans: {
    spanIndex: 'u32',
    lastStart: 'u32',
    lastNonzeroSlash: 'u32',
    prior: 'Vec<u32>'
  },
  /**
   * Lookup459: pallet_staking::slashing::SpanRecord<Balance>
   **/
  PalletStakingSlashingSpanRecord: {
    slashed: 'u128',
    paidOut: 'u128'
  },
  /**
   * Lookup462: pallet_staking::Releases
   **/
  PalletStakingReleases: {
    _enum: ['V1_0_0Ancient', 'V2_0_0', 'V3_0_0', 'V4_0_0', 'V5_0_0', 'V6_0_0', 'V7_0_0', 'V8_0_0', 'V9_0_0']
  },
  /**
   * Lookup463: pallet_staking::pallet::pallet::Error<T>
   **/
  PalletStakingPalletError: {
    _enum: ['NotController', 'NotStash', 'AlreadyBonded', 'AlreadyPaired', 'EmptyTargets', 'DuplicateIndex', 'InvalidSlashIndex', 'InsufficientBond', 'NoMoreChunks', 'NoUnlockChunk', 'FundedTarget', 'InvalidEraToReward', 'InvalidNumberOfNominations', 'NotSortedAndUnique', 'AlreadyClaimed', 'IncorrectHistoryDepth', 'IncorrectSlashingSpans', 'BadState', 'TooManyTargets', 'BadTarget', 'CannotChillOther', 'TooManyNominators', 'TooManyValidators', 'CommissionTooLow']
  },
  /**
   * Lookup467: sp_core::crypto::KeyTypeId
   **/
  SpCoreCryptoKeyTypeId: '[u8;4]',
  /**
   * Lookup468: pallet_session::pallet::Error<T>
   **/
  PalletSessionError: {
    _enum: ['InvalidProof', 'NoAssociatedValidatorId', 'DuplicatedKey', 'NoKeys', 'NoAccount']
  },
  /**
   * Lookup470: pallet_grandpa::StoredState<N>
   **/
  PalletGrandpaStoredState: {
    _enum: {
      Live: 'Null',
      PendingPause: {
        scheduledAt: 'u32',
        delay: 'u32',
      },
      Paused: 'Null',
      PendingResume: {
        scheduledAt: 'u32',
        delay: 'u32'
      }
    }
  },
  /**
   * Lookup471: pallet_grandpa::StoredPendingChange<N, Limit>
   **/
  PalletGrandpaStoredPendingChange: {
    scheduledAt: 'u32',
    delay: 'u32',
    nextAuthorities: 'Vec<(SpFinalityGrandpaAppPublic,u64)>',
    forced: 'Option<u32>'
  },
  /**
   * Lookup473: pallet_grandpa::pallet::Error<T>
   **/
  PalletGrandpaError: {
    _enum: ['PauseFailed', 'ResumeFailed', 'ChangePending', 'TooSoon', 'InvalidKeyOwnershipProof', 'InvalidEquivocationProof', 'DuplicateOffenceReport']
  },
  /**
   * Lookup479: pallet_im_online::BoundedOpaqueNetworkState<PeerIdEncodingLimit, MultiAddrEncodingLimit, AddressesLimit>
   **/
  PalletImOnlineBoundedOpaqueNetworkState: {
    peerId: 'Bytes',
    externalAddresses: 'Vec<Bytes>'
  },
  /**
   * Lookup483: pallet_im_online::pallet::Error<T>
   **/
  PalletImOnlineError: {
    _enum: ['InvalidKey', 'DuplicatedHeartbeat']
  },
  /**
   * Lookup484: sp_staking::offence::OffenceDetails<sp_core::crypto::AccountId32, Offender>
   **/
  SpStakingOffenceOffenceDetails: {
    offender: '(AccountId32,PalletStakingExposure)',
    reporters: 'Vec<AccountId32>'
  },
  /**
   * Lookup487: pallet_sudo::pallet::Error<T>
   **/
  PalletSudoError: {
    _enum: ['RequireSudo']
  },
  /**
   * Lookup488: pallet_bags_list::list::Node<T, I>
   **/
  PalletBagsListListNode: {
    id: 'AccountId32',
    prev: 'Option<AccountId32>',
    next: 'Option<AccountId32>',
    bagUpper: 'u64',
    score: 'u64'
  },
  /**
   * Lookup489: pallet_bags_list::list::Bag<T, I>
   **/
  PalletBagsListListBag: {
    head: 'Option<AccountId32>',
    tail: 'Option<AccountId32>'
  },
  /**
   * Lookup490: pallet_bags_list::pallet::Error<T, I>
   **/
  PalletBagsListError: {
    _enum: {
      List: 'PalletBagsListListListError'
    }
  },
  /**
   * Lookup491: pallet_bags_list::list::ListError
   **/
  PalletBagsListListListError: {
    _enum: ['Duplicate', 'NotHeavier', 'NotInSameBag', 'NodeNotFound']
  },
  /**
   * Lookup494: pallet_vesting::Releases
   **/
  PalletVestingReleases: {
    _enum: ['V0', 'V1']
  },
  /**
   * Lookup495: pallet_vesting::pallet::Error<T>
   **/
  PalletVestingError: {
    _enum: ['NotVesting', 'AtMaxVestingSchedules', 'AmountLow', 'ScheduleIndexOutOfBounds', 'InvalidScheduleParams']
  },
  /**
   * Lookup497: pallet_multisig::Multisig<BlockNumber, Balance, sp_core::crypto::AccountId32>
   **/
  PalletMultisigMultisig: {
    when: 'PalletMultisigTimepoint',
    deposit: 'u128',
    depositor: 'AccountId32',
    approvals: 'Vec<AccountId32>'
  },
  /**
   * Lookup499: pallet_multisig::pallet::Error<T>
   **/
  PalletMultisigError: {
    _enum: ['MinimumThreshold', 'AlreadyApproved', 'NoApprovalsNeeded', 'TooFewSignatories', 'TooManySignatories', 'SignatoriesOutOfOrder', 'SenderInSignatories', 'NotFound', 'NotOwner', 'NoTimepoint', 'WrongTimepoint', 'UnexpectedTimepoint', 'MaxWeightTooLow', 'AlreadyStored']
  },
  /**
   * Lookup500: pallet_council::CouncilStageUpdate<BlockNumber>
   **/
  PalletCouncilCouncilStageUpdate: {
    stage: 'PalletCouncilCouncilStage',
    changedAt: 'u32'
  },
  /**
   * Lookup501: pallet_council::CouncilStage<BlockNumber>
   **/
  PalletCouncilCouncilStage: {
    _enum: {
      Announcing: 'PalletCouncilCouncilStageAnnouncing',
      Election: 'PalletCouncilCouncilStageElection',
      Idle: 'PalletCouncilCouncilStageIdle'
    }
  },
  /**
   * Lookup502: pallet_council::CouncilStageAnnouncing<BlockNumber>
   **/
  PalletCouncilCouncilStageAnnouncing: {
    candidatesCount: 'u64',
    endsAt: 'u32'
  },
  /**
   * Lookup503: pallet_council::CouncilStageElection
   **/
  PalletCouncilCouncilStageElection: {
    candidatesCount: 'u64'
  },
  /**
   * Lookup504: pallet_council::CouncilStageIdle<BlockNumber>
   **/
  PalletCouncilCouncilStageIdle: {
    endsAt: 'u32'
  },
  /**
   * Lookup506: pallet_council::CouncilMember<sp_core::crypto::AccountId32, MemberId, Balance, BlockNumber>
   **/
  PalletCouncilCouncilMember: {
    stakingAccountId: 'AccountId32',
    rewardAccountId: 'AccountId32',
    membershipId: 'u64',
    stake: 'u128',
    lastPaymentBlock: 'u32',
    unpaidReward: 'u128'
  },
  /**
   * Lookup507: pallet_council::Candidate<sp_core::crypto::AccountId32, Balance, primitive_types::H256, VotePower>
   **/
  PalletCouncilCandidate: {
    stakingAccountId: 'AccountId32',
    rewardAccountId: 'AccountId32',
    cycleId: 'u64',
    stake: 'u128',
    votePower: 'u128',
    noteHash: 'Option<H256>'
  },
  /**
   * Lookup508: pallet_council::Error<T>
   **/
  PalletCouncilError: {
    _enum: ['BadOrigin', 'CantCandidateNow', 'CantReleaseStakeNow', 'CandidacyStakeTooLow', 'CantCandidateTwice', 'ConflictingStake', 'StakeStillNeeded', 'NoStake', 'InsufficientBalanceForStaking', 'CantVoteForYourself', 'MemberIdNotMatchAccount', 'InvalidAccountToStakeReuse', 'NotCandidatingNow', 'CantWithdrawCandidacyNow', 'NotCouncilor', 'InsufficientFundsForFundingRequest', 'ZeroBalanceFundRequest', 'RepeatedFundRequestAccount', 'EmptyFundingRequests', 'InsufficientTokensForFunding', 'ZeroTokensFunding', 'CandidateDoesNotExist', 'InsufficientBalanceForTransfer']
  },
  /**
   * Lookup509: pallet_referendum::ReferendumStage<BlockNumber, MemberId, VotePower>
   **/
  PalletReferendumReferendumStage: {
    _enum: {
      Inactive: 'Null',
      Voting: 'PalletReferendumReferendumStageVoting',
      Revealing: 'PalletReferendumReferendumStageRevealing'
    }
  },
  /**
   * Lookup510: pallet_referendum::ReferendumStageVoting<BlockNumber>
   **/
  PalletReferendumReferendumStageVoting: {
    started: 'u32',
    winningTargetCount: 'u64',
    currentCycleId: 'u64',
    endsAt: 'u32'
  },
  /**
   * Lookup511: pallet_referendum::ReferendumStageRevealing<BlockNumber, MemberId, VotePower>
   **/
  PalletReferendumReferendumStageRevealing: {
    started: 'u32',
    winningTargetCount: 'u64',
    intermediateWinners: 'Vec<PalletReferendumOptionResult>',
    currentCycleId: 'u64',
    endsAt: 'u32'
  },
  /**
   * Lookup512: pallet_referendum::CastVote<primitive_types::H256, Currency, MemberId>
   **/
  PalletReferendumCastVote: {
    commitment: 'H256',
    cycleId: 'u64',
    stake: 'u128',
    voteFor: 'Option<u64>'
  },
  /**
   * Lookup513: pallet_referendum::Error<T, I>
   **/
  PalletReferendumError: {
    _enum: ['BadOrigin', 'ReferendumNotRunning', 'RevealingNotInProgress', 'ConflictStakesOnAccount', 'InsufficientBalanceToStake', 'InsufficientStake', 'InvalidReveal', 'InvalidVote', 'VoteNotExisting', 'AlreadyVotedThisCycle', 'UnstakingVoteInSameCycle', 'SaltTooLong', 'UnstakingForbidden']
  },
  /**
   * Lookup514: pallet_membership::MembershipObject<sp_core::crypto::AccountId32>
   **/
  PalletMembershipMembershipObject: {
    handleHash: 'Bytes',
    rootAccount: 'AccountId32',
    controllerAccount: 'AccountId32',
    verified: 'bool',
    invites: 'u32'
  },
  /**
   * Lookup515: pallet_membership::StakingAccountMemberBinding<MemberId>
   **/
  PalletMembershipStakingAccountMemberBinding: {
    memberId: 'u64',
    confirmed: 'bool'
  },
  /**
   * Lookup516: pallet_membership::Error<T>
   **/
  PalletMembershipError: {
    _enum: ['NotEnoughBalanceToBuyMembership', 'ControllerAccountRequired', 'RootAccountRequired', 'UnsignedOrigin', 'MemberProfileNotFound', 'HandleAlreadyRegistered', 'HandleMustBeProvidedDuringRegistration', 'ReferrerIsNotMember', 'CannotTransferInvitesForNotMember', 'NotEnoughInvites', 'WorkingGroupLeaderNotSet', 'StakingAccountIsAlreadyRegistered', 'StakingAccountDoesntExist', 'StakingAccountAlreadyConfirmed', 'WorkingGroupBudgetIsNotSufficientForInviting', 'ConflictingLock', 'CannotExceedReferralCutPercentLimit', 'ConflictStakesOnAccount', 'InsufficientBalanceToCoverStake', 'GifLockExceedsCredit', 'InsufficientBalanceToGift']
  },
  /**
   * Lookup517: pallet_forum::Category<CategoryId, ThreadId, primitive_types::H256>
   **/
  PalletForumCategory: {
    titleHash: 'H256',
    descriptionHash: 'H256',
    archived: 'bool',
    numDirectSubcategories: 'u32',
    numDirectThreads: 'u32',
    numDirectModerators: 'u32',
    parentCategoryId: 'Option<u64>',
    stickyThreadIds: 'Vec<u64>'
  },
  /**
   * Lookup518: pallet_forum::Thread<ForumUserId, CategoryId, Balance>
   **/
  PalletForumThread: {
    categoryId: 'u64',
    authorId: 'u64',
    cleanupPayOff: 'u128',
    numberOfPosts: 'u64'
  },
  /**
   * Lookup519: pallet_forum::Post<ForumUserId, ThreadId, primitive_types::H256, Balance, BlockNumber>
   **/
  PalletForumPost: {
    threadId: 'u64',
    textHash: 'H256',
    authorId: 'u64',
    cleanupPayOff: 'u128',
    lastEdited: 'u32'
  },
  /**
   * Lookup520: pallet_forum::Error<T>
   **/
  PalletForumError: {
    _enum: ['OriginNotForumLead', 'ForumUserIdNotMatchAccount', 'ModeratorIdNotMatchAccount', 'AccountDoesNotMatchThreadAuthor', 'ThreadDoesNotExist', 'ModeratorModerateOriginCategory', 'ModeratorModerateDestinationCategory', 'ThreadMoveInvalid', 'ThreadNotBeingUpdated', 'InsufficientBalanceForThreadCreation', 'CannotDeleteThreadWithOutstandingPosts', 'PostDoesNotExist', 'AccountDoesNotMatchPostAuthor', 'InsufficientBalanceForPost', 'CategoryNotBeingUpdated', 'AncestorCategoryImmutable', 'MaxValidCategoryDepthExceeded', 'CategoryDoesNotExist', 'CategoryModeratorDoesNotExist', 'CategoryNotEmptyThreads', 'CategoryNotEmptyCategories', 'ModeratorCantDeleteCategory', 'ModeratorCantUpdateCategory', 'StickiedThreadIdsDuplicates', 'MapSizeLimit', 'PathLengthShouldBeGreaterThanZero']
  },
  /**
   * Lookup521: pallet_constitution::ConstitutionInfo
   **/
  PalletConstitutionConstitutionInfo: {
    textHash: 'Bytes'
  },
  /**
   * Lookup523: pallet_content::types::VideoRecord<ChannelId, pallet_content::nft::types::OwnedNft<pallet_content::nft::types::TransactionalStatusRecord<MemberId, Balance, pallet_content::nft::types::EnglishAuctionRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionRecord<BlockNumber, AuctionId, Balance, MemberId>>, MemberId, AuctionId>, DataObjectId, Balance>
   **/
  PalletContentVideoRecord: {
    inChannel: 'u64',
    nftStatus: 'Option<PalletContentNftTypesOwnedNft>',
    dataObjects: 'BTreeSet<u64>',
    videoStateBloatBond: 'u128'
  },
  /**
   * Lookup524: pallet_content::nft::types::OwnedNft<pallet_content::nft::types::TransactionalStatusRecord<MemberId, Balance, pallet_content::nft::types::EnglishAuctionRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionRecord<BlockNumber, AuctionId, Balance, MemberId>>, MemberId, AuctionId>
   **/
  PalletContentNftTypesOwnedNft: {
    owner: 'PalletContentNftTypesNftOwner',
    transactionalStatus: 'PalletContentNftTypesTransactionalStatusRecord',
    creatorRoyalty: 'Option<Perbill>',
    openAuctionsNonce: 'u64'
  },
  /**
   * Lookup525: pallet_content::nft::types::TransactionalStatusRecord<MemberId, Balance, pallet_content::nft::types::EnglishAuctionRecord<BlockNumber, Balance, MemberId>, pallet_content::nft::types::OpenAuctionRecord<BlockNumber, AuctionId, Balance, MemberId>>
   **/
  PalletContentNftTypesTransactionalStatusRecord: {
    _enum: {
      Idle: 'Null',
      InitiatedOfferToMember: '(u64,Option<u128>)',
      EnglishAuction: 'PalletContentNftTypesEnglishAuctionRecord',
      OpenAuction: 'PalletContentNftTypesOpenAuctionRecord',
      BuyNow: 'u128'
    }
  },
  /**
   * Lookup526: pallet_content::nft::types::EnglishAuctionRecord<BlockNumber, Balance, MemberId>
   **/
  PalletContentNftTypesEnglishAuctionRecord: {
    startingPrice: 'u128',
    buyNowPrice: 'Option<u128>',
    whitelist: 'BTreeSet<u64>',
    end: 'u32',
    start: 'u32',
    extensionPeriod: 'u32',
    minBidStep: 'u128',
    topBid: 'Option<PalletContentNftTypesEnglishAuctionBid>'
  },
  /**
   * Lookup528: pallet_content::nft::types::EnglishAuctionBid<Balance, MemberId>
   **/
  PalletContentNftTypesEnglishAuctionBid: {
    amount: 'u128',
    bidderId: 'u64'
  },
  /**
   * Lookup529: pallet_content::nft::types::OpenAuctionRecord<BlockNumber, AuctionId, Balance, MemberId>
   **/
  PalletContentNftTypesOpenAuctionRecord: {
    startingPrice: 'u128',
    buyNowPrice: 'Option<u128>',
    whitelist: 'BTreeSet<u64>',
    bidLockDuration: 'u32',
    auctionId: 'u64',
    start: 'u32'
  },
  /**
   * Lookup530: pallet_content::nft::types::NftOwner<MemberId>
   **/
  PalletContentNftTypesNftOwner: {
    _enum: {
      ChannelOwner: 'Null',
      Member: 'u64'
    }
  },
  /**
   * Lookup532: pallet_content::permissions::curator_group::CuratorGroup<T>
   **/
  PalletContentPermissionsCuratorGroup: {
    curators: 'BTreeMap<u64, BTreeSet<PalletContentChannelActionPermission>>',
    active: 'bool',
    permissionsByLevel: 'BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupContentModerationAction>>'
  },
  /**
   * Lookup533: pallet_content::nft::types::OpenAuctionBidRecord<Balance, BlockNumber, AuctionId>
   **/
  PalletContentNftTypesOpenAuctionBidRecord: {
    amount: 'u128',
    madeAtBlock: 'u32',
    auctionId: 'u64'
  },
  /**
   * Lookup534: pallet_content::errors::Error<T>
   **/
  PalletContentErrorsError: {
    _enum: ['ChannelStateBloatBondChanged', 'VideoStateBloatBondChanged', 'MinCashoutValueTooLow', 'MaxCashoutValueTooHigh', 'ChannelOwnerMemberDoesNotExist', 'ChannelOwnerCuratorGroupDoesNotExist', 'CuratorIsNotAMemberOfGivenCuratorGroup', 'CuratorIsAlreadyAMemberOfGivenCuratorGroup', 'CuratorGroupDoesNotExist', 'CuratorsPerGroupLimitReached', 'CuratorGroupIsNotActive', 'CuratorIdInvalid', 'LeadAuthFailed', 'MemberAuthFailed', 'CuratorAuthFailed', 'BadOrigin', 'ActorNotAuthorized', 'CategoryDoesNotExist', 'ChannelDoesNotExist', 'VideoDoesNotExist', 'VideoInSeason', 'ActorCannotBeLead', 'ActorCannotOwnChannel', 'NftAlreadyExists', 'NftDoesNotExist', 'OverflowOrUnderflowHappened', 'DoesNotOwnNft', 'RoyaltyUpperBoundExceeded', 'RoyaltyLowerBoundExceeded', 'AuctionDurationUpperBoundExceeded', 'AuctionDurationLowerBoundExceeded', 'ExtensionPeriodUpperBoundExceeded', 'ExtensionPeriodLowerBoundExceeded', 'BidLockDurationUpperBoundExceeded', 'BidLockDurationLowerBoundExceeded', 'StartingPriceUpperBoundExceeded', 'StartingPriceLowerBoundExceeded', 'AuctionBidStepUpperBoundExceeded', 'AuctionBidStepLowerBoundExceeded', 'InsufficientBalance', 'BidStepConstraintViolated', 'InvalidBidAmountSpecified', 'StartingPriceConstraintViolated', 'ActionHasBidsAlready', 'NftIsNotIdle', 'PendingOfferDoesNotExist', 'RewardAccountIsNotSet', 'ActorIsNotBidder', 'AuctionCannotBeCompleted', 'BidDoesNotExist', 'BidIsForPastAuction', 'StartsAtLowerBoundExceeded', 'StartsAtUpperBoundExceeded', 'AuctionDidNotStart', 'NotInAuctionState', 'MemberIsNotAllowedToParticipate', 'MemberProfileNotFound', 'NftNotInBuyNowState', 'InvalidBuyNowWitnessPriceProvided', 'IsNotOpenAuctionType', 'IsNotEnglishAuctionType', 'BidLockDurationIsNotExpired', 'NftAuctionIsAlreadyExpired', 'BuyNowIsLessThenStartingPrice', 'TargetMemberDoesNotExist', 'InvalidNftOfferWitnessPriceProvided', 'MaxAuctionWhiteListLengthUpperBoundExceeded', 'WhitelistHasOnlyOneMember', 'WhitelistedMemberDoesNotExist', 'NftNonChannelOwnerDoesNotExist', 'ExtensionPeriodIsGreaterThenAuctionDuration', 'NoAssetsSpecified', 'InvalidAssetsProvided', 'ChannelContainsVideos', 'ChannelContainsAssets', 'InvalidBagSizeSpecified', 'MigrationNotFinished', 'ReplyDoesNotExist', 'UnsufficientBalance', 'InsufficientTreasuryBalance', 'InvalidMemberProvided', 'ActorNotAMember', 'PaymentProofVerificationFailed', 'CashoutAmountExceedsMaximumAmount', 'CashoutAmountBelowMinimumAmount', 'WithdrawFromChannelAmountExceedsBalanceMinusExistentialDeposit', 'WithdrawFromChannelAmountIsZero', 'ChannelCashoutsDisabled', 'MinCashoutAllowedExceedsMaxCashoutAllowed', 'CuratorModerationActionNotAllowed', 'CuratorGroupMaxPermissionsByLevelMapSizeExceeded', 'ChannelFeaturePaused', 'ChannelBagMissing', 'AssetsToRemoveBeyondEntityAssetsSet', 'InvalidVideoDataObjectsCountProvided', 'InvalidChannelTransferStatus', 'InvalidChannelTransferAcceptor', 'InvalidChannelTransferCommitmentParams', 'ChannelAgentInsufficientPermissions', 'InvalidChannelOwner', 'ZeroReward', 'InsufficientBalanceForTransfer', 'InsufficientBalanceForChannelCreation', 'InsufficientBalanceForVideoCreation', 'InsufficientCouncilBudget', 'GlobalNftDailyLimitExceeded', 'GlobalNftWeeklyLimitExceeded', 'ChannelNftDailyLimitExceeded', 'ChannelNftWeeklyLimitExceeded', 'CreatorTokenAlreadyIssued', 'CreatorTokenNotIssued', 'MemberIdCouldNotBeDerivedFromActor', 'CannotWithdrawFromChannelWithCreatorTokenIssued', 'PatronageCanOnlyBeClaimedForMemberOwnedChannels', 'ChannelTransfersBlockedDuringRevenueSplits', 'ChannelTransfersBlockedDuringTokenSales']
  },
  /**
   * Lookup535: pallet_storage::BagRecord<StorageBucketId, pallet_storage::DistributionBucketIdRecord<DistributionBucketFamilyId, DistributionBucketIndex>>
   **/
  PalletStorageBagRecord: {
    storedBy: 'BTreeSet<u64>',
    distributedBy: 'BTreeSet<PalletStorageDistributionBucketIdRecord>',
    objectsTotalSize: 'u64',
    objectsNumber: 'u64'
  },
  /**
   * Lookup536: pallet_storage::StorageBucketRecord<WorkerId, sp_core::crypto::AccountId32>
   **/
  PalletStorageStorageBucketRecord: {
    operatorStatus: 'PalletStorageStorageBucketOperatorStatus',
    acceptingNewBags: 'bool',
    voucher: 'PalletStorageVoucher',
    assignedBags: 'u64'
  },
  /**
   * Lookup537: pallet_storage::StorageBucketOperatorStatus<WorkerId, sp_core::crypto::AccountId32>
   **/
  PalletStorageStorageBucketOperatorStatus: {
    _enum: {
      Missing: 'Null',
      InvitedStorageWorker: 'u64',
      StorageWorker: '(u64,AccountId32)'
    }
  },
  /**
   * Lookup538: pallet_storage::DynamicBagCreationPolicy<DistributionBucketFamilyId>
   **/
  PalletStorageDynamicBagCreationPolicy: {
    numberOfStorageBuckets: 'u64',
    families: 'BTreeMap<u64, u32>'
  },
  /**
   * Lookup540: pallet_storage::DataObject<Balance>
   **/
  PalletStorageDataObject: {
    _alias: {
      size_: 'size'
    },
    accepted: 'bool',
    stateBloatBond: 'u128',
    size_: 'u64',
    ipfsContentId: 'Bytes'
  },
  /**
   * Lookup541: pallet_storage::DistributionBucketFamilyRecord<DistributionBucketIndex>
   **/
  PalletStorageDistributionBucketFamilyRecord: {
    nextDistributionBucketIndex: 'u64'
  },
  /**
   * Lookup542: pallet_storage::DistributionBucketRecord<WorkerId>
   **/
  PalletStorageDistributionBucketRecord: {
    acceptingNewBags: 'bool',
    distributing: 'bool',
    pendingInvitations: 'BTreeSet<u64>',
    operators: 'BTreeSet<u64>',
    assignedBags: 'u64'
  },
  /**
   * Lookup543: pallet_common::constraints::BoundedValueConstraint<Val>
   **/
  PalletCommonConstraintsBoundedValueConstraint: {
    min: 'u64',
    maxMinDiff: 'u64'
  },
  /**
   * Lookup544: pallet_storage::Error<T>
   **/
  PalletStorageError: {
    _enum: ['ArithmeticError', 'InvalidCidLength', 'NoObjectsOnUpload', 'StorageBucketDoesntExist', 'StorageBucketIsNotBoundToBag', 'StorageBucketIsBoundToBag', 'NoStorageBucketInvitation', 'StorageProviderAlreadySet', 'StorageProviderMustBeSet', 'DifferentStorageProviderInvited', 'InvitedStorageProvider', 'StorageBucketIdCollectionsAreEmpty', 'StorageBucketsNumberViolatesDynamicBagCreationPolicy', 'DistributionBucketsViolatesDynamicBagCreationPolicy', 'EmptyContentId', 'ZeroObjectSize', 'InvalidStateBloatBondSourceAccount', 'InvalidStorageProvider', 'InsufficientBalance', 'DataObjectDoesntExist', 'UploadingBlocked', 'DataObjectIdCollectionIsEmpty', 'SourceAndDestinationBagsAreEqual', 'DataObjectBlacklisted', 'BlacklistSizeLimitExceeded', 'VoucherMaxObjectSizeLimitExceeded', 'VoucherMaxObjectNumberLimitExceeded', 'StorageBucketObjectNumberLimitReached', 'StorageBucketObjectSizeLimitReached', 'InsufficientTreasuryBalance', 'CannotDeleteNonEmptyStorageBucket', 'DataObjectIdParamsAreEmpty', 'StorageBucketsPerBagLimitTooLow', 'StorageBucketsPerBagLimitTooHigh', 'StorageBucketPerBagLimitExceeded', 'StorageBucketDoesntAcceptNewBags', 'DynamicBagExists', 'DynamicBagDoesntExist', 'StorageProviderOperatorDoesntExist', 'DataSizeFeeChanged', 'DataObjectStateBloatBondChanged', 'CannotDeleteNonEmptyDynamicBag', 'MaxDistributionBucketFamilyNumberLimitExceeded', 'DistributionBucketFamilyDoesntExist', 'DistributionBucketDoesntExist', 'DistributionBucketIdCollectionsAreEmpty', 'DistributionBucketDoesntAcceptNewBags', 'MaxDistributionBucketNumberPerBagLimitExceeded', 'DistributionBucketIsNotBoundToBag', 'DistributionBucketIsBoundToBag', 'DistributionBucketsPerBagLimitTooLow', 'DistributionBucketsPerBagLimitTooHigh', 'DistributionProviderOperatorDoesntExist', 'DistributionProviderOperatorAlreadyInvited', 'DistributionProviderOperatorSet', 'NoDistributionBucketInvitation', 'MustBeDistributionProviderOperatorForBucket', 'MaxNumberOfPendingInvitationsLimitForDistributionBucketReached', 'DistributionFamilyBoundToBagCreationPolicy', 'MaxDataObjectSizeExceeded', 'InvalidTransactorAccount', 'NumberOfStorageBucketsOutsideOfAllowedContraints', 'NumberOfDistributionBucketsOutsideOfAllowedContraints']
  },
  /**
   * Lookup545: pallet_project_token::types::AccountData<pallet_project_token::types::VestingSchedule<BlockNumber, Balance>, Balance, pallet_project_token::types::StakingStatus<Balance>, JoyBalance>
   **/
  PalletProjectTokenAccountData: {
    vestingSchedules: 'BTreeMap<PalletProjectTokenVestingSource, PalletProjectTokenVestingSchedule>',
    amount: 'u128',
    splitStakingStatus: 'Option<PalletProjectTokenStakingStatus>',
    bloatBond: 'u128',
    nextVestingTransferId: 'u64',
    lastSaleTotalPurchasedAmount: 'Option<(u32,u128)>'
  },
  /**
   * Lookup546: pallet_project_token::types::VestingSchedule<BlockNumber, Balance>
   **/
  PalletProjectTokenVestingSchedule: {
    linearVestingStartBlock: 'u32',
    linearVestingDuration: 'u32',
    cliffAmount: 'u128',
    postCliffTotalAmount: 'u128',
    burnedAmount: 'u128'
  },
  /**
   * Lookup547: pallet_project_token::types::StakingStatus<Balance>
   **/
  PalletProjectTokenStakingStatus: {
    splitId: 'u32',
    amount: 'u128'
  },
  /**
   * Lookup554: pallet_project_token::types::TokenData<Balance, primitive_types::H256, BlockNumber, pallet_project_token::types::TokenSale<JoyBalance, Balance, BlockNumber, pallet_project_token::types::VestingScheduleParams<BlockNumber>, MemberId, sp_core::crypto::AccountId32>, pallet_project_token::types::RevenueSplitState<JoyBalance, BlockNumber>>
   **/
  PalletProjectTokenTokenData: {
    totalSupply: 'u128',
    tokensIssued: 'u128',
    nextSaleId: 'u32',
    sale: 'Option<PalletProjectTokenTokenSale>',
    transferPolicy: 'PalletProjectTokenTransferPolicy',
    symbol: 'H256',
    patronageInfo: 'PalletProjectTokenPatronageData',
    accountsNumber: 'u64',
    revenueSplitRate: 'Permill',
    revenueSplit: 'PalletProjectTokenRevenueSplitState',
    nextRevenueSplitId: 'u32'
  },
  /**
   * Lookup555: pallet_project_token::types::RevenueSplitState<JoyBalance, BlockNumber>
   **/
  PalletProjectTokenRevenueSplitState: {
    _enum: {
      Inactive: 'Null',
      Active: 'PalletProjectTokenRevenueSplitInfo'
    }
  },
  /**
   * Lookup556: pallet_project_token::types::RevenueSplitInfo<JoyBalance, BlockNumber>
   **/
  PalletProjectTokenRevenueSplitInfo: {
    allocation: 'u128',
    timeline: 'PalletProjectTokenTimeline',
    dividendsClaimed: 'u128'
  },
  /**
   * Lookup557: pallet_project_token::types::Timeline<BlockNumber>
   **/
  PalletProjectTokenTimeline: {
    start: 'u32',
    duration: 'u32'
  },
  /**
   * Lookup559: pallet_project_token::types::PatronageData<Balance, BlockNumber>
   **/
  PalletProjectTokenPatronageData: {
    rate: 'Perquintill',
    unclaimedPatronageTallyAmount: 'u128',
    lastUnclaimedPatronageTallyBlock: 'u32'
  },
  /**
   * Lookup561: pallet_project_token::errors::Error<T>
   **/
  PalletProjectTokenErrorsError: {
    _enum: ['InsufficientTransferrableBalance', 'TokenDoesNotExist', 'AccountInformationDoesNotExist', 'MerkleProofVerificationFailure', 'TargetPatronageRateIsHigherThanCurrentRate', 'TokenSymbolAlreadyInUse', 'InitialAllocationToNonExistingMember', 'AccountAlreadyExists', 'TransferDestinationMemberDoesNotExist', 'TokenIssuanceNotInIdleState', 'InsufficientJoyBalance', 'JoyTransferSubjectToDusting', 'AttemptToRemoveNonOwnedAccountUnderPermissionedMode', 'AttemptToRemoveNonEmptyAccount', 'CannotJoinWhitelistInPermissionlessMode', 'CannotDeissueTokenWithOutstandingAccounts', 'NoUpcomingSale', 'NoActiveSale', 'InsufficientBalanceForTokenPurchase', 'NotEnoughTokensOnSale', 'SaleStartingBlockInThePast', 'SaleAccessProofRequired', 'SaleAccessProofParticipantIsNotSender', 'SalePurchaseCapExceeded', 'MaxVestingSchedulesPerAccountPerTokenReached', 'PreviousSaleNotFinalized', 'NoTokensToRecover', 'SaleDurationTooShort', 'SaleDurationIsZero', 'SaleUpperBoundQuantityIsZero', 'SaleCapPerMemberIsZero', 'SaleUnitPriceIsZero', 'SalePurchaseAmountIsZero', 'RevenueSplitTimeToStartTooShort', 'RevenueSplitDurationTooShort', 'RevenueSplitAlreadyActiveForToken', 'RevenueSplitNotActiveForToken', 'RevenueSplitDidNotEnd', 'RevenueSplitNotOngoing', 'UserAlreadyParticipating', 'InsufficientBalanceForSplitParticipation', 'UserNotParticipantingInAnySplit', 'CannotParticipateInSplitWithZeroAmount', 'CannotIssueSplitWithZeroAllocationAmount', 'CannotModifySupplyWhenRevenueSplitsAreActive', 'RevenueSplitRateIsZero', 'BurnAmountIsZero', 'BurnAmountGreaterThanAccountTokensAmount']
  },
  /**
   * Lookup562: pallet_proposals_engine::types::Proposal<BlockNumber, ProposerId, Balance, sp_core::crypto::AccountId32>
   **/
  PalletProposalsEngineProposal: {
    parameters: 'PalletProposalsEngineProposalParameters',
    proposerId: 'u64',
    activatedAt: 'u32',
    status: 'PalletProposalsEngineProposalStatusesProposalStatus',
    votingResults: 'PalletProposalsEngineVotingResults',
    exactExecutionBlock: 'Option<u32>',
    nrOfCouncilConfirmations: 'u32',
    stakingAccountId: 'Option<AccountId32>'
  },
  /**
   * Lookup563: pallet_proposals_engine::types::ProposalParameters<BlockNumber, Balance>
   **/
  PalletProposalsEngineProposalParameters: {
    votingPeriod: 'u32',
    gracePeriod: 'u32',
    approvalQuorumPercentage: 'u32',
    approvalThresholdPercentage: 'u32',
    slashingQuorumPercentage: 'u32',
    slashingThresholdPercentage: 'u32',
    requiredStake: 'Option<u128>',
    constitutionality: 'u32'
  },
  /**
   * Lookup564: pallet_proposals_engine::types::VotingResults
   **/
  PalletProposalsEngineVotingResults: {
    abstentions: 'u32',
    approvals: 'u32',
    rejections: 'u32',
    slashes: 'u32'
  },
  /**
   * Lookup566: pallet_proposals_engine::Error<T>
   **/
  PalletProposalsEngineError: {
    _enum: ['EmptyTitleProvided', 'EmptyDescriptionProvided', 'TitleIsTooLong', 'DescriptionIsTooLong', 'ProposalNotFound', 'ProposalFinalized', 'AlreadyVoted', 'NotAuthor', 'MaxActiveProposalNumberExceeded', 'EmptyStake', 'StakeShouldBeEmpty', 'StakeDiffersFromRequired', 'InvalidParameterApprovalThreshold', 'InvalidParameterSlashingThreshold', 'RequireRootOrigin', 'ProposalHasVotes', 'ZeroExactExecutionBlock', 'InvalidExactExecutionBlock', 'InsufficientBalanceForStake', 'ConflictingStakes', 'InvalidStakingAccountForMember']
  },
  /**
   * Lookup567: pallet_proposals_discussion::types::DiscussionThread<ThreadAuthorId, BlockNumber, MemberId>
   **/
  PalletProposalsDiscussionDiscussionThread: {
    activatedAt: 'u32',
    authorId: 'u64',
    mode: 'PalletProposalsDiscussionThreadMode'
  },
  /**
   * Lookup568: pallet_proposals_discussion::types::DiscussionPost<PostAuthorId, Balance, BlockNumber>
   **/
  PalletProposalsDiscussionDiscussionPost: {
    authorId: 'u64',
    cleanupPayOff: 'u128',
    lastEdited: 'u32'
  },
  /**
   * Lookup569: pallet_proposals_discussion::Error<T>
   **/
  PalletProposalsDiscussionError: {
    _enum: ['ThreadDoesntExist', 'PostDoesntExist', 'RequireRootOrigin', 'CannotPostOnClosedThread', 'NotAuthorOrCouncilor', 'MaxWhiteListSizeExceeded', 'WhitelistedMemberDoesNotExist', 'InsufficientBalanceForPost', 'CannotDeletePost']
  },
  /**
   * Lookup570: pallet_proposals_codex::Error<T>
   **/
  PalletProposalsCodexError: {
    _enum: ['SignalProposalIsEmpty', 'RuntimeProposalIsEmpty', 'InvalidFundingRequestProposalBalance', 'InvalidValidatorCount', 'RequireRootOrigin', 'InvalidCouncilElectionParameterCouncilSize', 'InvalidCouncilElectionParameterCandidacyLimit', 'InvalidCouncilElectionParameterMinVotingStake', 'InvalidCouncilElectionParameterNewTermDuration', 'InvalidCouncilElectionParameterMinCouncilStake', 'InvalidCouncilElectionParameterRevealingPeriod', 'InvalidCouncilElectionParameterVotingPeriod', 'InvalidCouncilElectionParameterAnnouncingPeriod', 'InvalidWorkingGroupBudgetCapacity', 'InvalidSetLeadParameterCannotBeCouncilor', 'SlashingStakeIsZero', 'DecreasingStakeIsZero', 'InsufficientFundsForBudgetUpdate', 'InvalidFundingRequestProposalNumberOfAccount', 'InvalidFundingRequestProposalRepeatedAccount', 'InvalidChannelPayoutsProposalMinCashoutExceedsMaxCashout', 'InvalidLeadWorkerId', 'InvalidLeadOpeningId', 'InvalidLeadApplicationId', 'InvalidProposalId']
  },
  /**
   * Lookup571: pallet_working_group::types::Opening<BlockNumber, Balance>
   **/
  PalletWorkingGroupOpening: {
    openingType: 'PalletWorkingGroupOpeningType',
    created: 'u32',
    descriptionHash: 'Bytes',
    stakePolicy: 'PalletWorkingGroupStakePolicy',
    rewardPerBlock: 'Option<u128>',
    creationStake: 'u128'
  },
  /**
   * Lookup572: pallet_working_group::types::JobApplication<sp_core::crypto::AccountId32, MemberId>
   **/
  PalletWorkingGroupJobApplication: {
    roleAccountId: 'AccountId32',
    rewardAccountId: 'AccountId32',
    stakingAccountId: 'AccountId32',
    memberId: 'u64',
    descriptionHash: 'Bytes',
    openingId: 'u64'
  },
  /**
   * Lookup573: pallet_working_group::types::GroupWorker<sp_core::crypto::AccountId32, MemberId, BlockNumber, Balance>
   **/
  PalletWorkingGroupGroupWorker: {
    memberId: 'u64',
    roleAccountId: 'AccountId32',
    stakingAccountId: 'AccountId32',
    rewardAccountId: 'AccountId32',
    startedLeavingAt: 'Option<u32>',
    jobUnstakingPeriod: 'u32',
    rewardPerBlock: 'Option<u128>',
    missedReward: 'Option<u128>',
    createdAt: 'u32'
  },
  /**
   * Lookup574: pallet_working_group::errors::Error<T, I>
   **/
  PalletWorkingGroupErrorsError: {
    _enum: ['StakeBalanceCannotBeZero', 'OpeningDoesNotExist', 'CannotHireMultipleLeaders', 'WorkerApplicationDoesNotExist', 'MaxActiveWorkerNumberExceeded', 'SuccessfulWorkerApplicationDoesNotExist', 'CannotHireLeaderWhenLeaderExists', 'IsNotLeadAccount', 'CurrentLeadNotSet', 'WorkerDoesNotExist', 'InvalidMemberOrigin', 'SignerIsNotWorkerRoleAccount', 'BelowMinimumStakes', 'InsufficientBalanceToCoverStake', 'ApplicationStakeDoesntMatchOpening', 'OriginIsNotApplicant', 'WorkerIsLeaving', 'CannotRewardWithZero', 'InvalidStakingAccountForMember', 'ConflictStakesOnAccount', 'WorkerHasNoReward', 'UnstakingPeriodLessThanMinimum', 'CannotSpendZero', 'InsufficientBudgetForSpending', 'NoApplicationsProvided', 'CannotDecreaseStakeDeltaGreaterThanStake', 'ApplicationsNotForOpening', 'WorkerStorageValueTooLong', 'InsufficientTokensForFunding', 'ZeroTokensFunding', 'InsufficientBalanceForTransfer']
  },
  /**
   * Lookup584: sp_runtime::MultiSignature
   **/
  SpRuntimeMultiSignature: {
    _enum: {
      Ed25519: 'SpCoreEd25519Signature',
      Sr25519: 'SpCoreSr25519Signature',
      Ecdsa: 'SpCoreEcdsaSignature'
    }
  },
  /**
   * Lookup585: sp_core::ecdsa::Signature
   **/
  SpCoreEcdsaSignature: '[u8;65]',
  /**
   * Lookup588: frame_system::extensions::check_non_zero_sender::CheckNonZeroSender<T>
   **/
  FrameSystemExtensionsCheckNonZeroSender: 'Null',
  /**
   * Lookup589: frame_system::extensions::check_spec_version::CheckSpecVersion<T>
   **/
  FrameSystemExtensionsCheckSpecVersion: 'Null',
  /**
   * Lookup590: frame_system::extensions::check_tx_version::CheckTxVersion<T>
   **/
  FrameSystemExtensionsCheckTxVersion: 'Null',
  /**
   * Lookup591: frame_system::extensions::check_genesis::CheckGenesis<T>
   **/
  FrameSystemExtensionsCheckGenesis: 'Null',
  /**
   * Lookup594: frame_system::extensions::check_nonce::CheckNonce<T>
   **/
  FrameSystemExtensionsCheckNonce: 'Compact<u32>',
  /**
   * Lookup595: frame_system::extensions::check_weight::CheckWeight<T>
   **/
  FrameSystemExtensionsCheckWeight: 'Null',
  /**
   * Lookup596: pallet_transaction_payment::ChargeTransactionPayment<T>
   **/
  PalletTransactionPaymentChargeTransactionPayment: 'Compact<u128>',
  /**
   * Lookup597: joystream_node_runtime::Runtime
   **/
  JoystreamNodeRuntimeRuntime: 'Null'
};
