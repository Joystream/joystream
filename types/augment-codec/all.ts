// This file was automatically generated via generate:augment-codec
import { ActorId, MemberId, BlockAndTime, ThreadId, PostId, InputValidationLengthConstraint, WorkingGroup, MemoText, BalanceKind, Address, LookupSource, ChannelId, DAOId, Url } from '../common';
import { Membership, StakingAccountMemberBinding, BuyMembershipParameters, InviteMembershipParameters } from '../members';
import { CouncilStageAnnouncing, CouncilStageElection, CouncilStageUpdate, CouncilStage, Candidate, CouncilMemberOf, CastVoteOf } from '../council';
import { ForumUserId, ModeratorId, CategoryId, PostReactionId, Category, Thread, Post, PollAlternative, Poll, PrivilegedActor, PollInput, Thread as ThreadOf, ExtendedPostId } from '../forum';
import { ApplicationId, Application, ApplicationInfo, ApplicationIdSet, ApplicationIdToWorkerIdMap, WorkerId, Worker, WorkerInfo, Opening, OpeningId, StakePolicy, StakeParameters, StorageProviderId, OpeningType, ApplyOnOpeningParameters, Penalty, RewardPaymentType } from '../working-group';
import { ContentId, LiaisonJudgement, DataObject, DataObjectStorageRelationshipId, DataObjectStorageRelationship, DataObjectTypeId, DataObjectType, DataObjectsMap, ContentParameters, StorageObjectOwner, StorageObjectOwner as ObjectOwner, Voucher, VoucherLimit, UploadingStatus } from '../storage';
import { ProposalId, ProposalStatus, Proposal as ProposalOf, ProposalDetails, ProposalDetails as ProposalDetailsOf, VotingResults, ProposalParameters, GeneralProposalParameters, VoteKind, DiscussionThread, DiscussionPost, CreateOpeningParameters, FillOpeningParameters, TerminateRoleParameters, ProposalDecision, ExecutionFailed, Approved, SetLeadParams, ThreadMode, ExecutionStatus, FundingRequestParameters } from '../proposals';
import { ReferendumStageVoting, ReferendumStageRevealing, ReferendumStage, OptionResult, VotePower } from '../referendum';
import { ConstitutionInfo } from '../constitution';
import { ParticipantId, Title, UpdatedTitle, UpdatedBody, ReplyId, Reply, ReplyToDelete } from '../blog';
import { BountyId, JSBounty, BountyMilestone, EntryId, BountyActor, AssuranceContractType, FundingType_Limited, FundingType_Perpetual, FundingType, BountyCreationParameters, OracleJudgment_Winner, OracleWorkEntryJudgment, OracleJudgment, Entry } from '../bounty';
import { CuratorId, CuratorGroupId, CuratorGroup, ContentActor, NewAsset, Channel, ChannelOwner, ChannelCategoryId, ChannelCategory, ChannelCategoryCreationParameters, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelUpdateParameters, ChannelOwnershipTransferRequestId, ChannelOwnershipTransferRequest, Video, VideoId, VideoCategoryId, VideoCategory, VideoCategoryCreationParameters, VideoCategoryUpdateParameters, VideoCreationParameters, VideoUpdateParameters, Person, PersonId, PersonController, PersonActor, PersonCreationParameters, PersonUpdateParameters, Playlist, PlaylistId, PlaylistCreationParameters, PlaylistUpdateParameters, SeriesId, Series, Season, SeriesParameters, SeasonParameters, EpisodeParemters, MaxNumber, IsCensored } from '../content';

export { ActorId, MemberId, BlockAndTime, ThreadId, PostId, InputValidationLengthConstraint, WorkingGroup, MemoText, BalanceKind, Address, LookupSource, ChannelId, DAOId, Url, Membership, StakingAccountMemberBinding, BuyMembershipParameters, InviteMembershipParameters, CouncilStageAnnouncing, CouncilStageElection, CouncilStageUpdate, CouncilStage, Candidate, CouncilMemberOf, CastVoteOf, ForumUserId, ModeratorId, CategoryId, PostReactionId, Category, Thread, Post, PollAlternative, Poll, PrivilegedActor, PollInput, ThreadOf, ExtendedPostId, ApplicationId, Application, ApplicationInfo, ApplicationIdSet, ApplicationIdToWorkerIdMap, WorkerId, Worker, WorkerInfo, Opening, OpeningId, StakePolicy, StakeParameters, StorageProviderId, OpeningType, ApplyOnOpeningParameters, Penalty, RewardPaymentType, ContentId, LiaisonJudgement, DataObject, DataObjectStorageRelationshipId, DataObjectStorageRelationship, DataObjectTypeId, DataObjectType, DataObjectsMap, ContentParameters, StorageObjectOwner, ObjectOwner, Voucher, VoucherLimit, UploadingStatus, ProposalId, ProposalStatus, ProposalOf, ProposalDetails, ProposalDetailsOf, VotingResults, ProposalParameters, GeneralProposalParameters, VoteKind, DiscussionThread, DiscussionPost, CreateOpeningParameters, FillOpeningParameters, TerminateRoleParameters, ProposalDecision, ExecutionFailed, Approved, SetLeadParams, ThreadMode, ExecutionStatus, FundingRequestParameters, ReferendumStageVoting, ReferendumStageRevealing, ReferendumStage, OptionResult, VotePower, ConstitutionInfo, ParticipantId, Title, UpdatedTitle, UpdatedBody, ReplyId, Reply, ReplyToDelete, BountyId, JSBounty, BountyMilestone, EntryId, BountyActor, AssuranceContractType, FundingType_Limited, FundingType_Perpetual, FundingType, BountyCreationParameters, OracleJudgment_Winner, OracleWorkEntryJudgment, OracleJudgment, Entry, CuratorId, CuratorGroupId, CuratorGroup, ContentActor, NewAsset, Channel, ChannelOwner, ChannelCategoryId, ChannelCategory, ChannelCategoryCreationParameters, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelUpdateParameters, ChannelOwnershipTransferRequestId, ChannelOwnershipTransferRequest, Video, VideoId, VideoCategoryId, VideoCategory, VideoCategoryCreationParameters, VideoCategoryUpdateParameters, VideoCreationParameters, VideoUpdateParameters, Person, PersonId, PersonController, PersonActor, PersonCreationParameters, PersonUpdateParameters, Playlist, PlaylistId, PlaylistCreationParameters, PlaylistUpdateParameters, SeriesId, Series, Season, SeriesParameters, SeasonParameters, EpisodeParemters, MaxNumber, IsCensored };