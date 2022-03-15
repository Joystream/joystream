use super::*;

/// Metadata for NFT issuance
pub type NftMetadata = Vec<u8>;

/// Owner royalty
pub type Royalty = Perbill;

/// Nft transactional status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum TransactionalStatusRecord<MemberId, Balance, EnglishAuctionType, OpenAuctionType> {
    Idle,
    InitiatedOfferToMember(MemberId, Option<Balance>),
    EnglishAuction(EnglishAuctionType),
    OpenAuction(OpenAuctionType),
    BuyNow(Balance),
}

impl<MemberId, Balance, EnglishAuction, OpenAuction> Default
    for TransactionalStatusRecord<MemberId, Balance, EnglishAuction, OpenAuction>
{
    fn default() -> Self {
        Self::Idle
    }
}

/// Owned Nft representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OwnedNft<TransactionalStatus, MemberId, AuctionId> {
    pub owner: NftOwner<MemberId>,
    pub transactional_status: TransactionalStatus,
    pub creator_royalty: Option<Royalty>,
    pub open_auctions_nonce: AuctionId,
}

impl<TransactionalStatus, MemberId, AuctionId: BaseArithmetic>
    OwnedNft<TransactionalStatus, MemberId, AuctionId>
{
    /// Create new Nft
    pub fn new(
        owner: NftOwner<MemberId>,
        creator_royalty: Option<Royalty>,
        transactional_status: TransactionalStatus,
    ) -> Self {
        Self {
            owner,
            transactional_status,
            creator_royalty,
            open_auctions_nonce: AuctionId::zero(),
        }
    }

    pub(crate) fn with_transactional_status(
        self,
        transactional_status: TransactionalStatus,
    ) -> Self {
        Self {
            transactional_status,
            ..self
        }
    }

    pub(crate) fn increment_open_auction_count(self) -> Self {
        Self {
            open_auctions_nonce: self.open_auctions_nonce.saturating_add(One::one()),
            ..self
        }
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NftOwner<MemberId> {
    ChannelOwner,
    Member(MemberId),
}

impl<MemberId> Default for NftOwner<MemberId> {
    fn default() -> Self {
        Self::ChannelOwner
    }
}

/// Parameters used to issue a nft
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct NftIssuanceParametersRecord<MemberId, InitTransactionalStatus> {
    /// Roayalty used for the author
    pub royalty: Option<Royalty>,
    /// Metadata
    pub nft_metadata: NftMetadata,
    /// member id Nft will be issued to
    pub non_channel_owner: Option<MemberId>,
    /// Initial transactional status for the nft
    pub init_transactional_status: InitTransactionalStatus,
}

pub type NftIssuanceParameters<T> = NftIssuanceParametersRecord<
    <T as common::MembershipTypes>::MemberId,
    InitTransactionalStatus<T>,
>;

/// Initial Transactional status for the Nft: See InitialTransactionalStatusRecord above
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InitTransactionalStatusRecord<EnglishAuctionParams, OpenAuctionParams, MemberId, Balance> {
    Idle,
    BuyNow(Balance),
    InitiatedOfferToMember(MemberId, Option<Balance>),
    EnglishAuction(EnglishAuctionParams),
    OpenAuction(OpenAuctionParams),
}

impl<EnglishAuctionParams, OpenAuctionParams, MemberId, Balance> Default
    for InitTransactionalStatusRecord<EnglishAuctionParams, OpenAuctionParams, MemberId, Balance>
{
    fn default() -> Self {
        Self::Idle
    }
}

/// English Auction
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishAuctionRecord<BlockNumber, Balance, MemberId: Ord> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub whitelist: BTreeSet<MemberId>,
    pub end: BlockNumber,
    pub auction_duration: BlockNumber,
    pub extension_period: BlockNumber,
    pub min_bid_step: Balance,
    pub top_bid: Option<EnglishBid<Balance, MemberId>>,
}

impl<
        BlockNumber: Copy + PartialOrd + Saturating,
        Balance: Copy + PartialOrd + Saturating,
        MemberId: Ord + Copy,
    > EnglishAuctionRecord<BlockNumber, Balance, MemberId>
{
    pub fn new(params: EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>) -> Self {
        Self {
            starting_price: params.starting_price,
            buy_now_price: params.buy_now_price,
            whitelist: params.whitelist.clone(),
            end: params.end,
            auction_duration: params.auction_duration,
            extension_period: params.extension_period,
            min_bid_step: params.min_bid_step,
            top_bid: None,
        }
    }

    pub(crate) fn ensure_whitelisted_participant<T: Trait>(
        &self,
        participant_id: MemberId,
    ) -> DispatchResult {
        ensure!(
            self.whitelist.is_empty() || self.whitelist.contains(&participant_id),
            Error::<T>::MemberIsNotAllowedToParticipate
        );
        Ok(())
    }

    pub(crate) fn ensure_auction_has_no_bids<T: Trait>(&self) -> DispatchResult {
        ensure!(self.top_bid.is_none(), Error::<T>::ActionHasBidsAlready);
        Ok(())
    }

    pub(crate) fn ensure_auction_can_be_canceled<T: Trait>(&self) -> DispatchResult {
        self.ensure_auction_has_no_bids::<T>()
    }

    pub(crate) fn ensure_auction_has_valid_bids<T: Trait>(&self) -> DispatchResult {
        self.ensure_auction_has_no_bids::<T>()
            .map_or_else(|_| Ok(()), |_| Err(Error::<T>::BidDoesNotExist.into()))
    }

    pub(crate) fn ensure_bid_can_be_made<T: Trait>(&self, amount: Balance) -> DispatchResult {
        if let Some(buy_now) = &self.buy_now_price {
            if amount > *buy_now {
                return Ok(());
            }
        }

        self.top_bid.as_ref().map_or_else(
            || {
                ensure!(
                    self.starting_price <= amount,
                    Error::<T>::StartingPriceConstraintViolated,
                );
                Ok(())
            },
            |top_bid| {
                ensure!(
                    top_bid.amount.saturating_add(self.min_bid_step) <= amount,
                    Error::<T>::BidStepConstraintViolated
                );
                Ok(())
            },
        )
    }

    pub(crate) fn ensure_auction_is_not_expired<T: Trait>(
        &self,
        now: BlockNumber,
    ) -> DispatchResult {
        ensure!(now <= self.end, Error::<T>::NftAuctionIsAlreadyExpired);
        Ok(())
    }

    pub(crate) fn ensure_auction_can_be_completed<T: Trait>(
        &self,
        now: BlockNumber,
    ) -> DispatchResult {
        self.ensure_auction_is_not_expired::<T>(now).map_or_else(
            |_| Ok(()),
            |_| Err(Error::<T>::AuctionCannotBeCompleted.into()),
        )
    }

    pub(crate) fn with_bid(self, amount: Balance, bidder_id: MemberId, block: BlockNumber) -> Self {
        let (auction_duration, end) = if self.end.saturating_sub(self.extension_period) < block {
            (
                self.auction_duration.saturating_add(self.extension_period),
                self.end.saturating_add(self.extension_period),
            )
        } else {
            (self.auction_duration, self.end)
        };

        Self {
            end,
            auction_duration,
            top_bid: Some(EnglishBid { amount, bidder_id }),
            ..self
        }
    }
}

/// Open Auction
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionRecord<BlockNumber, AuctionId, Balance, MemberId: Ord> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub whitelist: BTreeSet<MemberId>,
    pub bid_lock_duration: BlockNumber,
    pub auction_id: AuctionId,
}

impl<
        BlockNumber: Copy + Saturating + PartialOrd,
        AuctionId: Copy,
        Balance: Copy + PartialOrd + Saturating,
        MemberId: Ord + Copy,
    > OpenAuctionRecord<BlockNumber, AuctionId, Balance, MemberId>
{
    pub fn new(
        params: OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>,
        auction_nonce: AuctionId,
    ) -> Self {
        Self {
            starting_price: params.starting_price,
            buy_now_price: params.buy_now_price,
            whitelist: params.whitelist.clone(),
            bid_lock_duration: params.bid_lock_duration,
            auction_id: auction_nonce,
        }
    }

    pub(crate) fn ensure_whitelisted_participant<T: Trait>(
        &self,
        participant_id: MemberId,
    ) -> DispatchResult {
        ensure!(
            self.whitelist.is_empty() || self.whitelist.contains(&participant_id),
            Error::<T>::MemberIsNotAllowedToParticipate
        );
        Ok(())
    }

    pub(crate) fn ensure_auction_has_no_bids<T: Trait>(
        &self,
        video_id: T::VideoId,
    ) -> DispatchResult {
        ensure!(
            crate::BidByVideoAndMember::<T>::iter_prefix(video_id)
                .next()
                .is_none(),
            Error::<T>::ActionHasBidsAlready
        );
        Ok(())
    }

    pub(crate) fn ensure_auction_can_be_canceled<T: Trait>(
        &self,
        video_id: T::VideoId,
    ) -> DispatchResult {
        self.ensure_auction_has_no_bids::<T>(video_id)
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenBidRecord<Balance, BlockNumber, AuctionId> {
    pub amount: Balance,
    pub made_at_block: BlockNumber,
    pub auction_id: AuctionId,
}

impl<Balance: PartialEq, BlockNumber, AuctionId: PartialEq>
    OpenBidRecord<Balance, BlockNumber, AuctionId>
{
    pub(crate) fn new(amount: Balance, made_at_block: BlockNumber, auction_id: AuctionId) -> Self {
        Self {
            amount,
            made_at_block,
            auction_id,
        }
    }

    pub(crate) fn ensure_valid_bid_commit<T: Trait>(&self, commit: Balance) -> DispatchResult {
        ensure!(self.amount == commit, Error::<T>::InvalidBidAmountSpecified);
        Ok(())
    }

    pub(crate) fn ensure_bid_is_relevant<T: Trait>(&self, auction_id: AuctionId) -> DispatchResult {
        ensure!(
            self.auction_id == auction_id,
            Error::<T>::InvalidBidAmountSpecified
        );
        Ok(())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishBid<Balance, MemberId> {
    pub amount: Balance,
    pub bidder_id: MemberId,
}

/// English Auction Init Params
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId: Ord> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub whitelist: BTreeSet<MemberId>,
    pub end: BlockNumber,
    pub auction_duration: BlockNumber,
    pub extension_period: BlockNumber,
    pub min_bid_step: Balance,
}

/// Open Auction Init Params
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionParamsRecord<BlockNumber, Balance, MemberId: Ord> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub whitelist: BTreeSet<MemberId>,
    pub bid_lock_duration: BlockNumber,
}

// Aliases
pub type EnglishAuction<T> = EnglishAuctionRecord<
    <T as frame_system::Trait>::BlockNumber,
    CurrencyOf<T>,
    <T as common::MembershipTypes>::MemberId,
>;

pub type OpenAuction<T> = OpenAuctionRecord<
    <T as frame_system::Trait>::BlockNumber,
    <T as Trait>::OpenAuctionId,
    CurrencyOf<T>,
    <T as common::MembershipTypes>::MemberId,
>;

pub type EnglishAuctionParams<T> = EnglishAuctionParamsRecord<
    <T as frame_system::Trait>::BlockNumber,
    CurrencyOf<T>,
    <T as common::MembershipTypes>::MemberId,
>;

pub type OpenAuctionParams<T> = OpenAuctionParamsRecord<
    <T as frame_system::Trait>::BlockNumber,
    CurrencyOf<T>,
    <T as common::MembershipTypes>::MemberId,
>;

pub type OpenBid<T> = OpenBidRecord<
    CurrencyOf<T>,
    <T as frame_system::Trait>::BlockNumber,
    <T as Trait>::OpenAuctionId,
>;

pub type Nft<T> = OwnedNft<
    TransactionalStatus<T>,
    <T as common::MembershipTypes>::MemberId,
    <T as Trait>::OpenAuctionId,
>;

pub type TransactionalStatus<T> = TransactionalStatusRecord<
    <T as common::MembershipTypes>::MemberId,
    CurrencyOf<T>,
    EnglishAuction<T>,
    OpenAuction<T>,
>;

pub type InitTransactionalStatus<T> = InitTransactionalStatusRecord<
    EnglishAuctionParams<T>,
    OpenAuctionParams<T>,
    <T as common::MembershipTypes>::MemberId,
    CurrencyOf<T>,
>;
