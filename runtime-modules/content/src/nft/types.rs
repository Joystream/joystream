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

    pub(crate) fn with_member_owner(self, member_id: MemberId) -> Self {
        Self {
            owner: NftOwner::<MemberId>::Member(member_id),
            ..self
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
    pub start: BlockNumber, // starting block
    pub extension_period: BlockNumber,
    pub min_bid_step: Balance,
    pub top_bid: Option<EnglishAuctionBid<Balance, MemberId>>,
}

impl<
        BlockNumber: Copy + PartialOrd + Saturating + Zero,
        Balance: Copy + PartialOrd + Saturating,
        MemberId: Ord + Copy,
    > EnglishAuctionRecord<BlockNumber, Balance, MemberId>
{
    pub fn new(
        params: EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId>,
        current_block: BlockNumber,
    ) -> Self {
        let start = params.starts_at.unwrap_or(current_block);
        Self {
            starting_price: params.starting_price,
            buy_now_price: params.buy_now_price,
            whitelist: params.whitelist.clone(),
            start,
            end: start.saturating_add(params.duration),
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

    pub(crate) fn ensure_top_bid_exists<T: Trait>(
        &self,
    ) -> Result<EnglishAuctionBid<Balance, MemberId>, DispatchError> {
        self.top_bid
            .to_owned()
            .ok_or_else(|| Error::<T>::BidDoesNotExist.into())
    }

    pub(crate) fn ensure_constraints_on_bid_amount<T: Trait>(
        &self,
        amount: Balance,
    ) -> DispatchResult {
        if let Some(buy_now) = &self.buy_now_price {
            if amount > *buy_now {
                return Ok(());
            }
        }

        if let Some(ref top_bid) = self.top_bid {
            ensure!(
                top_bid.amount.saturating_add(self.min_bid_step) <= amount,
                Error::<T>::BidStepConstraintViolated
            );
            Ok(())
        } else {
            ensure!(
                self.starting_price <= amount,
                Error::<T>::StartingPriceConstraintViolated,
            );
            Ok(())
        }
    }

    pub(crate) fn ensure_auction_started<T: Trait>(&self, now: BlockNumber) -> DispatchResult {
        ensure!(now >= self.start, Error::<T>::AuctionDidNotStart);
        Ok(())
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
        // sniping extension logic:
        // If bid block is in [end - extension_period, end) then new end += extension_period
        let end = if self.end.saturating_sub(self.extension_period) <= block {
            self.end.saturating_add(self.extension_period)
        } else {
            self.end
        };

        Self {
            end,
            top_bid: Some(EnglishAuctionBid { amount, bidder_id }),
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
    pub start: BlockNumber, // starting block
}

impl<
        BlockNumber: Copy + Saturating + PartialOrd,
        AuctionId: Copy + PartialEq,
        Balance: Copy + PartialOrd + Saturating,
        MemberId: Ord + Copy,
    > OpenAuctionRecord<BlockNumber, AuctionId, Balance, MemberId>
{
    pub(crate) fn ensure_can_make_bid<T: Trait>(
        &self,
        now: BlockNumber,
        new_offer: Balance,
        old_bid: &Option<OpenAuctionBidRecord<Balance, BlockNumber, AuctionId>>,
    ) -> DispatchResult {
        if let Some(completion_price) = self.buy_now_price {
            if completion_price <= new_offer {
                return Ok(());
            }
        }

        old_bid.as_ref().map_or_else(
            || self.ensure_offer_above_reserve::<T>(new_offer),
            |bid| self.ensure_can_update_bid::<T>(now, new_offer, bid),
        )
    }

    pub(crate) fn ensure_offer_above_reserve<T: Trait>(
        &self,
        new_offer: Balance,
    ) -> DispatchResult {
        ensure!(
            self.starting_price <= new_offer,
            Error::<T>::StartingPriceConstraintViolated,
        );
        Ok(())
    }

    pub(crate) fn ensure_can_update_bid<T: Trait>(
        &self,
        block: BlockNumber,
        new_offer: Balance,
        old_bid: &OpenAuctionBidRecord<Balance, BlockNumber, AuctionId>,
    ) -> DispatchResult {
        if old_bid.is_offer_lower(new_offer) {
            self.ensure_bid_lock_duration_expired::<T>(block, &old_bid)
        } else {
            Ok(())
        }
    }

    pub fn new(
        params: OpenAuctionParamsRecord<BlockNumber, Balance, MemberId>,
        auction_nonce: AuctionId,
        current_block: BlockNumber,
    ) -> Self {
        let start = params.starts_at.unwrap_or(current_block);
        Self {
            starting_price: params.starting_price,
            buy_now_price: params.buy_now_price,
            whitelist: params.whitelist.clone(),
            bid_lock_duration: params.bid_lock_duration,
            start,
            auction_id: auction_nonce,
        }
    }

    pub(crate) fn ensure_auction_started<T: Trait>(&self, now: BlockNumber) -> DispatchResult {
        ensure!(now >= self.start, Error::<T>::AuctionDidNotStart);
        Ok(())
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

    pub(crate) fn make_bid(
        &self,
        amount: Balance,
        made_at_block: BlockNumber,
    ) -> OpenAuctionBidRecord<Balance, BlockNumber, AuctionId> {
        OpenAuctionBidRecord::<Balance, BlockNumber, AuctionId> {
            amount,
            made_at_block,
            auction_id: self.auction_id,
        }
    }

    pub(crate) fn ensure_bid_can_be_canceled<T: Trait>(
        &self,
        now: BlockNumber,
        bid: &OpenAuctionBidRecord<Balance, BlockNumber, AuctionId>,
    ) -> DispatchResult {
        if bid.ensure_bid_is_relevant::<T>(self.auction_id).is_ok() {
            self.ensure_bid_lock_duration_expired::<T>(now, bid)
        } else {
            Ok(())
        }
    }

    pub(crate) fn ensure_bid_lock_duration_expired<T: Trait>(
        &self,
        now: BlockNumber,
        bid: &OpenAuctionBidRecord<Balance, BlockNumber, AuctionId>,
    ) -> DispatchResult {
        bid.ensure_lock_duration_expired::<T>(now, self.bid_lock_duration)
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionBidRecord<Balance, BlockNumber, AuctionId> {
    pub amount: Balance,
    pub made_at_block: BlockNumber,
    pub auction_id: AuctionId,
}

impl<
        Balance: Copy + PartialOrd + PartialEq,
        BlockNumber: Saturating + PartialOrd + Copy,
        AuctionId: PartialEq,
    > OpenAuctionBidRecord<Balance, BlockNumber, AuctionId>
{
    pub(crate) fn is_offer_lower(&self, new_offer: Balance) -> bool {
        self.amount > new_offer
    }

    pub(crate) fn ensure_lock_duration_expired<T: Trait>(
        &self,
        now: BlockNumber,
        bid_lock_duration: BlockNumber,
    ) -> DispatchResult {
        ensure!(
            now.saturating_sub(self.made_at_block) >= bid_lock_duration,
            Error::<T>::BidLockDurationIsNotExpired
        );
        Ok(())
    }

    pub(crate) fn ensure_valid_bid_commit<T: Trait>(&self, commit: Balance) -> DispatchResult {
        ensure!(self.amount == commit, Error::<T>::InvalidBidAmountSpecified);
        Ok(())
    }

    pub(crate) fn ensure_bid_is_relevant<T: Trait>(&self, auction_id: AuctionId) -> DispatchResult {
        ensure!(
            self.auction_id == auction_id,
            Error::<T>::BidIsForPastAuction
        );
        Ok(())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishAuctionBid<Balance, MemberId> {
    pub amount: Balance,
    pub bidder_id: MemberId,
}

/// English Auction Init Params:
/// auction is started IMMEDIATELY after it is created with extr: `start_open_auction`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishAuctionParamsRecord<BlockNumber, Balance, MemberId: Ord> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub whitelist: BTreeSet<MemberId>,
    pub starts_at: Option<BlockNumber>, // auction starting block
    pub duration: BlockNumber,
    pub extension_period: BlockNumber,
    pub min_bid_step: Balance,
}

/// Open Auction Init Params
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionParamsRecord<BlockNumber, Balance, MemberId: Ord> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub starts_at: Option<BlockNumber>, // auction starting block
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

pub type OpenAuctionBid<T> = OpenAuctionBidRecord<
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
