use super::*;

/// Metadata for NFT issuance
pub type Metadata = Vec<u8>;

pub type CuratorGroupId<T> = <T as ContentActorAuthenticator>::CuratorGroupId;
pub type CuratorId<T> = <T as ContentActorAuthenticator>::CuratorId;
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Owner royalty
pub type Royalty = Perbill;

/// NFT transactional status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum TransactionalStatus<
    BlockNumber: BaseArithmetic + Copy,
    MemberId: Default + Copy + Ord,
    AccountId: Default + Clone + Ord,
    Balance: Default + Clone,
> {
    Idle,
    InitiatedOfferToMember(MemberId, Option<Balance>),
    Auction(AuctionRecord<BlockNumber, Balance, MemberId, AccountId>),
    BuyNow(Balance),
}

impl<
        BlockNumber: BaseArithmetic + Copy,
        MemberId: Default + Copy + Ord,
        AccountId: Default + Clone + Ord,
        Balance: Default + Clone,
    > Default for TransactionalStatus<BlockNumber, MemberId, AccountId, Balance>
{
    fn default() -> Self {
        Self::Idle
    }
}

/// Owned NFT representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OwnedNFT<
    BlockNumber: BaseArithmetic + Copy,
    MemberId: Default + Copy + Ord,
    AccountId: Default + Clone + Ord,
    Balance: Default + Clone,
> {
    pub owner: NFTOwner<MemberId>,
    pub transactional_status: TransactionalStatus<BlockNumber, MemberId, AccountId, Balance>,
    pub creator_royalty: Option<Royalty>,
}

impl<
        BlockNumber: BaseArithmetic + Copy,
        MemberId: Default + Copy + PartialEq + Ord,
        AccountId: Default + Clone + PartialEq + Ord,
        Balance: Default + Clone,
    > OwnedNFT<BlockNumber, MemberId, AccountId, Balance>
{
    /// Create new NFT
    pub fn new(owner: NFTOwner<MemberId>, creator_royalty: Option<Royalty>) -> Self {
        Self {
            owner,
            transactional_status: TransactionalStatus::Idle,
            creator_royalty,
        }
    }

    /// Get nft auction record
    pub fn ensure_auction_state<T: Trait>(
        &self,
    ) -> Result<AuctionRecord<BlockNumber, Balance, MemberId, AccountId>, Error<T>> {
        if let TransactionalStatus::Auction(auction) = &self.transactional_status {
            Ok(auction.to_owned())
        } else {
            Err(Error::<T>::NotInAuctionState)
        }
    }

    ///  Ensure nft transactional status is set to `Idle`
    pub fn ensure_nft_transactional_status_is_idle<T: Trait>(&self) -> DispatchResult {
        if let TransactionalStatus::Idle = self.transactional_status {
            Ok(())
        } else {
            Err(Error::<T>::NftIsNotIdle.into())
        }
    }

    /// Sets nft transactional status to `BuyNow`
    pub fn set_buy_now_transactionl_status(mut self, buy_now_price: Balance) -> Self {
        self.transactional_status = TransactionalStatus::BuyNow(buy_now_price);
        self
    }

    /// Sets nft transactional status to provided `Auction`
    pub fn set_auction_transactional_status(
        mut self,
        auction: AuctionRecord<BlockNumber, Balance, MemberId, AccountId>,
    ) -> Self {
        self.transactional_status = TransactionalStatus::Auction(auction);
        self
    }

    /// Set nft transactional status to `Idle`
    pub fn set_idle_transactional_status(mut self) -> Self {
        self.transactional_status = TransactionalStatus::Idle;
        self
    }

    /// Set nft transactional status to `InitiatedOfferToMember`
    pub fn set_pending_offer_transactional_status(
        mut self,
        to: MemberId,
        balance: Option<Balance>,
    ) -> Self {
        self.transactional_status = TransactionalStatus::InitiatedOfferToMember(to, balance);
        self
    }

    /// Ensure NFT has pending offer
    pub fn ensure_pending_offer_exists<T: Trait>(&self) -> DispatchResult {
        ensure!(
            matches!(
                self.transactional_status,
                TransactionalStatus::InitiatedOfferToMember(..),
            ),
            Error::<T>::PendingTransferDoesNotExist
        );

        Ok(())
    }

    /// Ensure NFT transactional status is set to buy now.
    pub fn ensure_buy_now_transactional_status<T: Trait>(&self) -> DispatchResult {
        ensure!(
            matches!(self.transactional_status, TransactionalStatus::BuyNow(..),),
            Error::<T>::NFTNotInBuyNowState
        );

        Ok(())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NFTOwner<MemberId> {
    ChannelOwner,
    Member(MemberId),
}

impl<MemberId> Default for NFTOwner<MemberId> {
    fn default() -> Self {
        Self::ChannelOwner
    }
}

/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Bid<MemberId, AccountId, BlockNumber: BaseArithmetic + Copy, Balance> {
    pub bidder: MemberId,
    pub bidder_account_id: AccountId,
    pub amount: Balance,
    pub made_at_block: BlockNumber,
}

impl<MemberId, AccountId, BlockNumber: BaseArithmetic + Copy, Balance>
    Bid<MemberId, AccountId, BlockNumber, Balance>
{
    fn new(
        bidder: MemberId,
        bidder_account_id: AccountId,
        amount: Balance,
        made_at_block: BlockNumber,
    ) -> Self {
        Self {
            bidder,
            bidder_account_id,
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
    Balance: Clone,
    MemberId: Ord + Clone,
    AccountId: Ord + Clone,
> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    /// Auction type (either english or open)
    pub auction_type: AuctionType<BlockNumber>,
    pub minimal_bid_step: Balance,
    pub last_bid: Option<Bid<MemberId, AccountId, BlockNumber, Balance>>,
    pub starts_at: BlockNumber,
    pub whitelist: BTreeSet<MemberId>,
}

impl<
        BlockNumber: BaseArithmetic + Copy + Default + Clone,
        Balance: Default + BaseArithmetic + Clone,
        MemberId: Default + PartialEq + Ord + Clone,
        AccountId: Default + PartialEq + Ord + Clone,
    > AuctionRecord<BlockNumber, Balance, MemberId, AccountId>
{
    /// Create a new auction record with provided parameters
    pub fn new<VideoId>(
        auction_params: AuctionParams<VideoId, BlockNumber, Balance, MemberId>,
    ) -> Self {
        if let Some(starts_at) = auction_params.starts_at {
            Self {
                starting_price: auction_params.starting_price,
                buy_now_price: auction_params.buy_now_price,
                auction_type: auction_params.auction_type,
                minimal_bid_step: auction_params.minimal_bid_step,
                last_bid: None,
                starts_at,
                whitelist: auction_params.whitelist,
            }
        } else {
            Self {
                starting_price: auction_params.starting_price,
                buy_now_price: auction_params.buy_now_price,
                auction_type: auction_params.auction_type,
                minimal_bid_step: auction_params.minimal_bid_step,
                last_bid: None,
                starts_at: BlockNumber::default(),
                whitelist: auction_params.whitelist,
            }
        }
    }

    /// Ensure new bid is greater then last bid + minimal bid step
    pub fn ensure_is_valid_bid<T: Trait>(&self, new_bid: Balance) -> DispatchResult {
        // Always allow to buy now
        match &self.buy_now_price {
            Some(buy_now_price) if new_bid >= *buy_now_price => (),

            // Ensure new bid is greater then last bid + minimal bid step
            _ => {
                if let Some(last_bid) = &self.last_bid {
                    ensure!(
                        last_bid
                            .amount
                            .checked_add(&self.minimal_bid_step)
                            .ok_or(Error::<T>::OverflowOrUnderflowHappened)?
                            <= new_bid,
                        Error::<T>::BidStepConstraintViolated
                    );
                } else {
                    ensure!(
                        self.starting_price <= new_bid,
                        Error::<T>::StartingPriceConstraintViolated
                    );
                }
            }
        }

        Ok(())
    }

    /// Make auction bid
    pub fn make_bid(
        mut self,
        bidder: MemberId,
        bidder_account_id: AccountId,
        bid: Balance,
        current_block: BlockNumber,
    ) -> Self {
        let bid = Bid::new(bidder, bidder_account_id, bid, current_block);
        match &mut self.auction_type {
            AuctionType::English(EnglishAuctionDetails {
                extension_period,
                auction_duration,
            }) if current_block - self.starts_at >= *auction_duration - *extension_period => {
                // bump auction duration when bid is made during extension period.
                *auction_duration += *extension_period;
            }
            _ => (),
        }

        self.last_bid = Some(bid);
        self
    }

    /// Cnacel auction bid
    pub fn cancel_bid(mut self) -> Self {
        self.last_bid = None;
        self
    }

    // Ensure auction has no bids
    fn ensure_has_no_bids<T: Trait>(&self) -> DispatchResult {
        ensure!(self.last_bid.is_none(), Error::<T>::ActionHasBidsAlready);
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
            Error::<T>::NFTAuctionIsAlreadyExpired
        );
        Ok(())
    }

    /// Whether caller is last bidder
    pub fn is_last_bidder(&self, who: MemberId) -> bool {
        matches!(&self.last_bid, Some(last_bid) if last_bid.bidder == who)
    }

    /// Ensure caller is last bidder.
    pub fn ensure_caller_is_last_bidder<T: Trait>(&self, who: MemberId) -> DispatchResult {
        ensure!(self.is_last_bidder(who), Error::<T>::CallerIsNotAWinner);
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

    /// Ensure bid lock duration expired
    pub fn ensure_bid_lock_duration_expired<T: Trait>(
        &self,
        current_block: BlockNumber,
        bid: &Bid<MemberId, AccountId, BlockNumber, Balance>,
    ) -> DispatchResult {
        if let AuctionType::Open(OpenAuctionDetails { bid_lock_duration }) = &self.auction_type {
            ensure!(
                current_block - bid.made_at_block >= *bid_lock_duration,
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
        let last_bid = self.ensure_last_bid_exists::<T>()?;

        // Ensure caller is last bidder.
        self.ensure_caller_is_last_bidder::<T>(who)?;

        // ensure bid lock duration expired
        self.ensure_bid_lock_duration_expired::<T>(current_block, last_bid)
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
    pub fn ensure_last_bid_exists<T: Trait>(
        &self,
    ) -> Result<&Bid<MemberId, AccountId, BlockNumber, Balance>, Error<T>> {
        if let Some(bid) = &self.last_bid {
            Ok(bid)
        } else {
            Err(Error::<T>::LastBidDoesNotExist)
        }
    }
}

/// Auction alias type for simplification.
pub type Auction<T> = AuctionRecord<
    <T as frame_system::Trait>::BlockNumber,
    BalanceOf<T>,
    MemberId<T>,
    <T as frame_system::Trait>::AccountId,
>;

/// OwnedNFT alias type for simplification.
pub type Nft<T> = OwnedNFT<
    <T as frame_system::Trait>::BlockNumber,
    MemberId<T>,
    <T as frame_system::Trait>::AccountId,
    BalanceOf<T>,
>;

/// Parameters, needed for auction start
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionParams<VideoId, BlockNumber, Balance, MemberId: Ord> {
    pub video_id: VideoId,
    /// Auction type (either english or open)
    pub auction_type: AuctionType<BlockNumber>,
    pub starting_price: Balance,
    pub minimal_bid_step: Balance,
    pub buy_now_price: Option<Balance>,
    pub starts_at: Option<BlockNumber>,
    pub whitelist: BTreeSet<MemberId>,
}

/// Auction type
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AuctionType<BlockNumber> {
    // English auction details
    English(EnglishAuctionDetails<BlockNumber>),
    // Open auction details
    Open(OpenAuctionDetails<BlockNumber>),
}

impl<BlockNumber: Default> Default for AuctionType<BlockNumber> {
    fn default() -> Self {
        Self::English(EnglishAuctionDetails::default())
    }
}

/// English auction details
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishAuctionDetails<BlockNumber> {
    // the remaining time on a lot will automatically reset to to the preset extension time
    // if a new bid is placed within that period
    pub extension_period: BlockNumber,
    // auction duration
    pub auction_duration: BlockNumber,
}

/// Open auction details
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionDetails<BlockNumber> {
    pub bid_lock_duration: BlockNumber,
}
