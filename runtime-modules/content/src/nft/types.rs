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
    Balance: Default,
> {
    Idle,
    InitiatedOfferToMember(MemberId, Option<Balance>),
    Auction(AuctionRecord<BlockNumber, Balance, MemberId>),
    BuyNow(Balance),
}

impl<BlockNumber: BaseArithmetic + Copy, MemberId: Default + Copy + Ord, Balance: Default> Default
    for TransactionalStatus<BlockNumber, MemberId, Balance>
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
    CuratorGroupId: Default + Copy,
    DAOId: Default + Copy,
    Balance: Default,
> {
    pub owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
    pub transactional_status: TransactionalStatus<BlockNumber, MemberId, Balance>,
    pub creator_royalty: Option<Royalty>,
}

impl<
        BlockNumber: BaseArithmetic + Copy,
        MemberId: Default + Copy + PartialEq + Ord,
        CuratorGroupId: Default + Copy + PartialEq,
        DAOId: Default + Copy + PartialEq,
        Balance: Default,
    > OwnedNFT<BlockNumber, MemberId, CuratorGroupId, DAOId, Balance>
{
    /// Whether provided owner is nft owner
    pub fn is_owner(&self, owner: &ChannelOwner<MemberId, CuratorGroupId, DAOId>) -> bool {
        self.owner.eq(owner)
    }

    /// Create new NFT
    pub fn new(
        owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
        creator_royalty: Option<Royalty>,
    ) -> Self {
        Self {
            owner,
            transactional_status: TransactionalStatus::Idle,
            creator_royalty,
        }
    }
}

/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Bid<MemberId, BlockNumber: BaseArithmetic + Copy, Balance> {
    pub bidder: MemberId,
    pub amount: Balance,
    pub time: BlockNumber,
}

impl<MemberId, BlockNumber: BaseArithmetic + Copy, Balance> Bid<MemberId, BlockNumber, Balance> {
    fn new(bidder: MemberId, amount: Balance, time: BlockNumber) -> Self {
        Self {
            bidder,
            amount,
            time,
        }
    }
}

/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionRecord<BlockNumber: BaseArithmetic + Copy, Balance, MemberId: Ord> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    /// Auction type (either english or open)
    pub auction_type: AuctionType<BlockNumber>,
    pub minimal_bid_step: Balance,
    pub last_bid: Option<Bid<MemberId, BlockNumber, Balance>>,
    pub starts_at: BlockNumber,
    pub whitelist: Option<BTreeSet<MemberId>>,
}

impl<
        BlockNumber: BaseArithmetic + Copy + Default,
        Balance: Default + BaseArithmetic,
        MemberId: Default + PartialEq + Ord,
    > AuctionRecord<BlockNumber, Balance, MemberId>
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
                starts_at: starts_at,
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
                        self.minimal_bid_step <= new_bid,
                        Error::<T>::BidStepConstraintViolated
                    );
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
    pub fn make_bid(&mut self, who: MemberId, bid: Balance, current_block: BlockNumber) {
        let bid = Bid::new(who, bid, current_block);
        match &mut self.auction_type {
            AuctionType::English(EnglishAuctionDetails {
                extension_period,
                auction_duration,
            }) if current_block - auction.starts_at >= auction_duration - extension_period => {
                // bump auction duration when bid is made during extension period.
                *auction_duration = auction_duration + extension_period;
            }
        }

        self.last_bid = Some(bid);
    }

    /// Cnacel auction bid
    pub fn cancel_bid(&mut self) {
        self.last_bid = None;
    }

    /// Check whether auction have any bids
    fn is_active(&self) -> bool {
        self.last_bid.is_some()
    }

    // Ensure auction is not active
    fn ensure_is_not_active<T: Trait>(&self) -> DispatchResult {
        ensure!(self.is_active(), Error::<T>::ActionIsAlreadyActive);
        Ok(())
    }

    /// Ensure given auction can be canceled
    pub fn ensure_auction_can_be_canceled<T: Trait>(&self) -> DispatchResult {
        if let AuctionType::English(_) = self.auction_type {
            self.ensure_is_not_active::<T>()
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
        bid: &Bid<MemberId, BlockNumber, Balance>,
    ) -> DispatchResult {
        if let AuctionType::Open(bid_lock_duration) = &self.auction_type {
            ensure!(
                current_block - bid.time >= *bid_lock_duration,
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
        if let Some(whitelist) = &self.whitelist {
            ensure!(
                whitelist.contains(&who),
                Error::<T>::MemberIsNotAllowedToParticipate
            );
        }
        Ok(())
    }

    /// Ensure auction has last bid, return corresponding reference
    pub fn ensure_last_bid_exists<T: Trait>(
        &self,
    ) -> Result<&Bid<MemberId, BlockNumber, Balance>, Error<T>> {
        if let Some(bid) = &self.last_bid {
            Ok(bid)
        } else {
            Err(Error::<T>::LastBidDoesNotExist)
        }
    }
}

/// Auction alias type for simplification.
pub type Auction<T> =
    AuctionRecord<<T as frame_system::Trait>::BlockNumber, BalanceOf<T>, MemberId<T>>;

/// OwnedNFT alias type for simplification.
pub type Nft<T> = OwnedNFT<
    <T as frame_system::Trait>::BlockNumber,
    MemberId<T>,
    CuratorGroupId<T>,
    DAOId<T>,
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
    pub whitelist: Option<BTreeSet<MemberId>>,
}

/// Auction type
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AuctionType<BlockNumber> {
    // English auction details
    English(EnglishAuctionDeatails<BlockNumber>),
    // Open auction details
    Open(OpenAuctionDetails<BlockNumber>),
}

impl<BlockNumber: Default> Default for AuctionType<BlockNumber> {
    fn default() -> Self {
        Self::English(BlockNumber::default())
    }
}

/// English auction details
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
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
