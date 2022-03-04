use super::*;
use sp_runtime::traits::Zero;
use sp_std::collections::btree_map::BTreeMap;

/// Metadata for NFT issuance
pub type NftMetadata = Vec<u8>;

/// Owner royalty
pub type Royalty = Perbill;

/// Nft transactional status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum TransactionalStatusRecord<
    BlockNumber: BaseArithmetic + Copy + Default,
    MemberId: Default + Copy + Ord,
    Balance: Default + Clone + BaseArithmetic,
> {
    Idle,
    InitiatedOfferToMember(MemberId, Option<Balance>),
    Auction(AuctionRecord<BlockNumber, Balance, MemberId>),
    BuyNow(Balance),
}

impl<
        BlockNumber: BaseArithmetic + Copy + Default,
        MemberId: Default + Copy + Ord,
        Balance: Default + Clone + BaseArithmetic,
    > Default for TransactionalStatusRecord<BlockNumber, MemberId, Balance>
{
    fn default() -> Self {
        Self::Idle
    }
}

pub type TransactionalStatus<T> = TransactionalStatusRecord<
    <T as frame_system::Trait>::BlockNumber,
    <T as common::MembershipTypes>::MemberId,
    CurrencyOf<T>,
>;

/// Owned Nft representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OwnedNft<
    BlockNumber: BaseArithmetic + Copy + Default,
    MemberId: Default + Copy + Ord,
    Balance: Default + Clone + BaseArithmetic,
> {
    pub owner: NftOwner<MemberId>,
    pub transactional_status: TransactionalStatusRecord<BlockNumber, MemberId, Balance>,
    pub creator_royalty: Option<Royalty>,
}

impl<
        BlockNumber: BaseArithmetic + Copy + Default,
        MemberId: Default + Copy + PartialEq + Ord,
        Balance: Default + Clone + BaseArithmetic,
    > OwnedNft<BlockNumber, MemberId, Balance>
{
    /// Create new Nft
    pub fn new(
        owner: NftOwner<MemberId>,
        creator_royalty: Option<Royalty>,
        transactional_status: TransactionalStatusRecord<BlockNumber, MemberId, Balance>,
    ) -> Self {
        Self {
            owner,
            transactional_status,
            creator_royalty,
        }
    }

    /// Set nft owner
    pub fn set_owner(mut self, owner: NftOwner<MemberId>) -> Self {
        self.owner = owner;
        self
    }

    /// Get nft auction record
    pub fn ensure_auction_state<T: Trait>(
        &self,
    ) -> Result<AuctionRecord<BlockNumber, Balance, MemberId>, Error<T>> {
        if let TransactionalStatusRecord::Auction(auction) = &self.transactional_status {
            Ok(auction.to_owned())
        } else {
            Err(Error::<T>::NotInAuctionState)
        }
    }

    ///  Ensure nft transactional status is set to `Idle`
    pub fn ensure_nft_transactional_status_is_idle<T: Trait>(&self) -> DispatchResult {
        if let TransactionalStatusRecord::Idle = self.transactional_status {
            Ok(())
        } else {
            Err(Error::<T>::NftIsNotIdle.into())
        }
    }

    /// Sets nft transactional status to `BuyNow`
    pub fn set_buy_now_transactionl_status(mut self, buy_now_price: Balance) -> Self {
        self.transactional_status = TransactionalStatusRecord::BuyNow(buy_now_price);
        self
    }

    /// Sets nft transactional status to provided `Auction`
    pub fn set_auction_transactional_status(
        mut self,
        auction: AuctionRecord<BlockNumber, Balance, MemberId>,
    ) -> Self {
        self.transactional_status = TransactionalStatusRecord::Auction(auction);
        self
    }

    /// Set nft transactional status to `Idle`
    pub fn set_idle_transactional_status(mut self) -> Self {
        self.transactional_status = TransactionalStatusRecord::Idle;
        self
    }

    /// Set nft transactional status to `InitiatedOfferToMember`
    pub fn set_pending_offer_transactional_status(
        mut self,
        to: MemberId,
        balance: Option<Balance>,
    ) -> Self {
        self.transactional_status = TransactionalStatusRecord::InitiatedOfferToMember(to, balance);
        self
    }

    /// Ensure Nft has pending offer
    pub fn ensure_pending_offer_state<T: Trait>(&self) -> DispatchResult {
        ensure!(
            matches!(
                self.transactional_status,
                TransactionalStatusRecord::InitiatedOfferToMember(..),
            ),
            Error::<T>::PendingOfferDoesNotExist
        );
        Ok(())
    }

    /// Ensure Nft is in BuyNow state
    pub fn ensure_buy_now_state<T: Trait>(&self) -> DispatchResult {
        ensure!(
            matches!(
                self.transactional_status,
                TransactionalStatusRecord::BuyNow(..),
            ),
            Error::<T>::NftNotInBuyNowState
        );
        Ok(())
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

/// OwnedNft alias type for simplification.
pub type Nft<T> = OwnedNft<
    <T as frame_system::Trait>::BlockNumber,
    <T as common::MembershipTypes>::MemberId,
    CurrencyOf<T>,
>;

/// Parameters, needed for auction start
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionParams<BlockNumber, Balance: Zero + Default + Clone, MemberId: Ord> {
    // Auction type (either english or open)
    pub auction_type: AuctionType<BlockNumber, Balance>,
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub starts_at: Option<BlockNumber>,
    pub whitelist: BTreeSet<MemberId>,
}

/// Auction type
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AuctionType<BlockNumber, Balance: Zero + Default + Clone> {
    // English auction details
    English(EnglishAuctionDetails<BlockNumber, Balance>),
    // Open auction details
    Open(OpenAuctionDetails<BlockNumber>),
}

impl<BlockNumber: Default, Balance: Zero + Default + Clone> Default
    for AuctionType<BlockNumber, Balance>
{
    fn default() -> Self {
        Self::English(EnglishAuctionDetails::default())
    }
}

/// English auction details
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishAuctionDetails<BlockNumber, Balance: Zero + Default + Clone> {
    // the remaining time on a lot will automatically reset to to the preset extension time
    // if a new bid is placed within that period
    pub extension_period: BlockNumber,
    // auction duration
    pub auction_duration: BlockNumber,
    // bid step
    pub bid_step: Balance,
}

/// Open auction details
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionDetails<BlockNumber> {
    // bid lock duration
    pub bid_lock_duration: BlockNumber,
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
pub enum InitTransactionalStatusRecord<
    BlockNumber: BaseArithmetic + Copy + Default,
    MemberId: Default + Copy + Ord,
    Balance: Default + Clone + BaseArithmetic,
> {
    Idle,
    BuyNow(Balance),
    InitiatedOfferToMember(MemberId, Option<Balance>),
    Auction(AuctionParams<BlockNumber, Balance, MemberId>),
}

impl<
        BlockNumber: BaseArithmetic + Copy + Default,
        MemberId: Default + Copy + Ord,
        Balance: Default + Clone + BaseArithmetic,
    > Default for InitTransactionalStatusRecord<BlockNumber, MemberId, Balance>
{
    fn default() -> Self {
        Self::Idle
    }
}

pub type InitTransactionalStatus<T> = InitTransactionalStatusRecord<
    <T as frame_system::Trait>::BlockNumber,
    <T as common::MembershipTypes>::MemberId,
    CurrencyOf<T>,
>;

// Auction implementation
/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Bid<BlockNumber: BaseArithmetic + Copy, Balance> {
    pub amount: Balance,
    pub made_at_block: BlockNumber,
}

impl<BlockNumber: BaseArithmetic + Copy, Balance> Bid<BlockNumber, Balance> {
    fn new(amount: Balance, made_at_block: BlockNumber) -> Self {
        Self {
            amount,
            made_at_block,
        }
    }
}

/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionRecord<
    BlockNumber: BaseArithmetic + Copy,
    Balance: Clone + Zero + Default,
    MemberId: Ord + Clone,
> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    /// Auction type (either english or open)
    pub auction_type: AuctionType<BlockNumber, Balance>,
    pub starts_at: BlockNumber,
    pub whitelist: BTreeSet<MemberId>,
    pub bid_list: BTreeMap<MemberId, Bid<BlockNumber, Balance>>,
}

impl<
        BlockNumber: BaseArithmetic + Copy + Default + Clone,
        Balance: Default + BaseArithmetic + Clone,
        MemberId: Default + PartialEq + Ord + Clone,
    > AuctionRecord<BlockNumber, Balance, MemberId>
{
    /// Create a new auction record with provided parameters
    pub fn new(auction_params: AuctionParams<BlockNumber, Balance, MemberId>) -> Self {
        if let Some(starts_at) = auction_params.starts_at {
            Self {
                starting_price: auction_params.starting_price,
                buy_now_price: auction_params.buy_now_price,
                auction_type: auction_params.auction_type,
                starts_at,
                whitelist: auction_params.whitelist,
                ..Default::default()
            }
        } else {
            Self {
                starting_price: auction_params.starting_price,
                buy_now_price: auction_params.buy_now_price,
                auction_type: auction_params.auction_type,
                whitelist: auction_params.whitelist,
                ..Default::default()
            }
        }
    }

    /// Ensure new bid is greater then last bid + minimal bid step
    pub fn ensure_is_valid_bid<T: Trait>(
        &self,
        new_bid: Balance,
        participant_id: MemberId,
        current_block: BlockNumber,
    ) -> DispatchResult {
        // 1. if bid >= Some(buy_now) -> Ok(())
        if let Some(buy_now) = &self.buy_now_price {
            if new_bid > *buy_now {
                return Ok(());
            }
        }

        let (base_bid, last_bid_block) = self.bid_list.get(&participant_id).map_or_else(
            || -> Result<(Balance, BlockNumber), DispatchError> {
                ensure!(
                    self.starting_price <= new_bid,
                    Error::<T>::StartingPriceConstraintViolated
                );
                Ok((self.starting_price.clone(), Default::default()))
            },
            |bid| Ok((bid.amount.clone(), bid.made_at_block)),
        )?;

        // 3. if type = English: bid >= (base_bid || start_price) + bid_step
        match &self.auction_type {
            AuctionType::English(EnglishAuctionDetails { bid_step, .. }) => {
                ensure!(
                    base_bid.saturating_add(bid_step.clone()) <= new_bid,
                    Error::<T>::BidStepConstraintViolated
                );
            }
            AuctionType::Open(_) => {
                // smaller offer allowed only after locking duration
                // last_bid_block = default() gives no problems
                if new_bid < base_bid {
                    self.ensure_bid_lock_duration_expired::<T>(current_block, last_bid_block)?
                };
            }
        };

        Ok(())
    }

    /// Make auction bid
    pub fn make_bid(
        &mut self,
        bidder: MemberId,
        amount: Balance,
        last_bid_block: BlockNumber,
    ) -> (bool, Bid<BlockNumber, Balance>) {
        let bid = Bid::new(amount, last_bid_block);
        let is_extended = match &mut self.auction_type {
            AuctionType::English(EnglishAuctionDetails {
                extension_period,
                auction_duration,
                ..
            }) if last_bid_block.saturating_add(*extension_period)
                >= self.starts_at.saturating_add(*auction_duration) =>
            {
                // bump auction duration when bid is made during extension period.
                *auction_duration = auction_duration.saturating_add(*extension_period);
                true
            }
            _ => false,
        };

        let _ = self.bid_list.insert(bidder, bid.clone());
        (is_extended, bid)
    }

    /// Canacel auction bid, PRECONDITIONS:
    /// 1. self.bid_list.contains_key(who)
    pub fn cancel_bid(mut self, who: &MemberId, block: BlockNumber) -> Self {
        if let Some(Bid { amount, .. }) = self.bid_list.remove(who) {
            T::Currency::unreserve(&who, amount);
        }
        self
    }

    // Ensure auction has no bids
    fn ensure_has_no_bids<T: Trait>(&self) -> DispatchResult {
        ensure!(self.bid_list.is_empty(), Error::<T>::ActionHasBidsAlready);
        Ok(())
    }

    /// Ensure given auction can be canceled
    pub fn ensure_auction_can_be_canceled<T: Trait>(&self) -> DispatchResult {
        if let AuctionType::English(_) = self.auction_type {
            self.ensure_has_no_bids::<T>()
        } else {
            Ok(())
        }
    }

    /// Ensure auction have been already started
    pub fn ensure_auction_started<T: Trait>(&self, current_block: BlockNumber) -> DispatchResult {
        ensure!(
            self.starts_at <= current_block,
            Error::<T>::AuctionDidNotStart
        );
        Ok(())
    }

    /// Check whether nft auction expired
    pub fn is_nft_auction_expired(&self, current_block: BlockNumber) -> bool {
        if let AuctionType::English(EnglishAuctionDetails {
            auction_duration, ..
        }) = self.auction_type
        {
            // Check whether auction time expired.
            (current_block - self.starts_at) >= auction_duration
        } else {
            // Open auction never expires
            false
        }
    }

    /// Ensure nft auction not expired
    pub fn ensure_nft_auction_not_expired<T: Trait>(
        &self,
        current_block: BlockNumber,
    ) -> DispatchResult {
        ensure!(
            !self.is_nft_auction_expired(current_block),
            Error::<T>::NftAuctionIsAlreadyExpired
        );
        Ok(())
    }

    /// Ensure auction type is `Open`
    pub fn ensure_is_open_auction<T: Trait>(&self) -> DispatchResult {
        ensure!(
            matches!(&self.auction_type, AuctionType::Open(_)),
            Error::<T>::IsNotOpenAuctionType
        );
        Ok(())
    }

    /// Ensure auction type is `English`
    pub fn ensure_is_english_auction<T: Trait>(&self) -> DispatchResult {
        ensure!(
            matches!(&self.auction_type, AuctionType::English(_)),
            Error::<T>::IsNotEnglishAuctionType
        );
        Ok(())
    }

    /// Ensure bid lock duration expired
    pub fn ensure_bid_lock_duration_expired<T: Trait>(
        &self,
        current_block: BlockNumber,
        last_bid_block: BlockNumber,
    ) -> DispatchResult {
        if let AuctionType::Open(OpenAuctionDetails { bid_lock_duration }) = &self.auction_type {
            ensure!(
                current_block - last_bid_block >= *bid_lock_duration,
                Error::<T>::BidLockDurationIsNotExpired
            );
        }
        Ok(())
    }

    /// Ensure bid can be cancelled
    pub fn ensure_bid_can_be_canceled<T: Trait>(
        &self,
        who: MemberId,
        current_block: BlockNumber,
    ) -> DispatchResult {
        // ensure is open auction
        self.ensure_is_open_auction::<T>()?;

        // ensure last bid exists
        let bid = self.ensure_bid_exists::<T>(&who)?;

        // ensure bid lock duration expired
        self.ensure_bid_lock_duration_expired::<T>(current_block, bid.made_at_block)
    }

    /// If whitelist set, ensure provided member is authorized to make bids
    pub fn ensure_whitelisted_participant<T: Trait>(&self, who: MemberId) -> DispatchResult {
        if !self.whitelist.is_empty() {
            ensure!(
                self.whitelist.contains(&who),
                Error::<T>::MemberIsNotAllowedToParticipate
            );
        }
        Ok(())
    }

    /// Ensure auction has last bid, return corresponding reference
    pub fn ensure_bid_exists<T: Trait>(
        &self,
        who: &MemberId,
    ) -> Result<Bid<BlockNumber, Balance>, DispatchError> {
        self.bid_list.get(who).map_or_else(
            || Err(Error::<T>::BidDoesNotExist.into()),
            |bid| Ok(bid.clone()),
        )
    }
}

/// Auction alias type for simplification.
pub type Auction<T> = AuctionRecord<
    <T as frame_system::Trait>::BlockNumber,
    CurrencyOf<T>,
    <T as common::MembershipTypes>::MemberId,
>;
