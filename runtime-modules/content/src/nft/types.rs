use super::*;

/// Metadata for vNFT issuance
type Metadata = Vec<u8>;

pub type CuratorGroupId<T> = <T as ContentActorAuthenticator>::CuratorGroupId;
pub type CuratorId<T> = <T as ContentActorAuthenticator>::CuratorId;
pub type MemberId<T> = <T as MembershipTypes>::MemberId;

/// Owner royalty
pub type Royalty = Perbill;

/// NFT transactional status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum TransactionalStatus<
    AccountId,
    Moment: BaseArithmetic + Copy,
    MemberId: Default + Copy,
    Balance,
> {
    Idle,
    InitiatedTransferToMember(MemberId),
    Auction(AuctionRecord<AccountId, Moment, Balance>),
}

impl<AccountId, Moment: BaseArithmetic + Copy, MemberId: Default + Copy, Balance> Default
    for TransactionalStatus<AccountId, Moment, MemberId, Balance>
{
    fn default() -> Self {
        Self::Idle
    }
}

impl<
        AccountId: Default + PartialEq,
        Moment: BaseArithmetic + Copy,
        MemberId: Default + Copy,
        Balance,
    > OwnedNFT<AccountId, Moment, MemberId, Balance>
{
    /// Create new vNFT
    pub fn new(owner: AccountId, creator_royalty: Option<Royalty>) -> Self {
        Self {
            owner,
            transactional_status: TransactionalStatus::Idle,
            creator_royalty,
        }
    }

    /// Ensure given account id is vNFT owner
    pub fn ensure_ownership<T: Trait>(&self, owner: &AccountId) -> DispatchResult {
        ensure!(self.owner.eq(owner), Error::<T>::DoesNotOwnVNFT);
        Ok(())
    }
}

/// Owned vNFT representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OwnedNFT<AccountId, Moment: BaseArithmetic + Copy, MemberId: Default + Copy, Balance> {
    pub owner: AccountId,
    pub transactional_status: TransactionalStatus<AccountId, Moment, MemberId, Balance>,
    pub creator_royalty: Option<Royalty>,
}

impl<AccountId: PartialEq, Moment: BaseArithmetic + Copy, MemberId: Default + Copy, Balance>
    OwnedNFT<AccountId, Moment, MemberId, Balance>
{
    pub fn is_owner(&self, account_id: &AccountId) -> bool {
        self.owner.eq(account_id)
    }
}

/// Enum, representing nft issuance status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NFTStatus<AccountId, Moment: BaseArithmetic + Copy, MemberId: Default + Copy, Balance> {
    NoneIssued,
    Owned(OwnedNFT<AccountId, Moment, MemberId, Balance>),
}

impl<AccountId, Moment: BaseArithmetic + Copy, MemberId: Default + Copy, Balance> Default
    for NFTStatus<AccountId, Moment, MemberId, Balance>
{
    fn default() -> Self {
        Self::NoneIssued
    }
}

/// Either new auction, which requires vNFT issance or auction for already existing nft.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AuctionMode {
    // Auction, where nft issued at the end
    WithIssuance(Option<Royalty>, Metadata),
    // Auction for already existing nft
    WithoutIsuance,
}

impl Default for AuctionMode {
    fn default() -> Self {
        Self::WithoutIsuance
    }
}

/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Bid<AccountId, Moment: BaseArithmetic + Copy, Balance> {
    pub bidder: AccountId,
    pub amount: Balance,
    pub time: Moment,
}

impl<AccountId, Moment: BaseArithmetic + Copy, Balance> Bid<AccountId, Moment, Balance> {
    fn new(bidder: AccountId, amount: Balance, time: Moment) -> Self {
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
pub struct AuctionRecord<AccountId, Moment: BaseArithmetic + Copy, Balance> {
    pub auction_mode: AuctionMode,
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub auction_duration: Moment,
    pub minimal_bid_step: Balance,
    pub last_bid: Option<Bid<AccountId, Moment, Balance>>,
}

impl<
        AccountId: Default + PartialEq,
        Moment: BaseArithmetic + Copy + Default,
        Balance: Default + BaseArithmetic,
    > AuctionRecord<AccountId, Moment, Balance>
{
    /// Create a new auction record with provided parameters
    pub fn new<VideoId>(auction_params: AuctionParams<VideoId, Moment, Balance>) -> Self {
        let AuctionParams {
            auction_mode,
            auction_duration,
            starting_price,
            buy_now_price,
            minimal_bid_step,
            ..
        } = auction_params;
        Self {
            auction_mode,
            starting_price,
            buy_now_price,
            auction_duration,
            minimal_bid_step,
            last_bid: None,
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
                            < new_bid,
                        Error::<T>::InvalidBid
                    );
                } else {
                    ensure!(self.minimal_bid_step < new_bid, Error::<T>::InvalidBid);
                }
            }
        }

        Ok(())
    }

    /// Make auction bid
    pub fn make_bid(&mut self, who: AccountId, bid: Balance, last_bid_time: Moment) {
        let bid = Bid::new(who, bid, last_bid_time);
        self.last_bid = Some(bid);
    }

    // Check whether auction have any bids
    fn is_active(&self) -> bool {
        self.last_bid.is_some()
    }

    /// Ensure auction is not active
    pub fn ensure_is_not_active<T: Trait>(&self) -> DispatchResult {
        ensure!(self.is_active(), Error::<T>::ActionIsAlreadyActive);
        Ok(())
    }

    /// Check whether auction round time expired
    pub fn is_nft_auction_auction_duration_expired(&self, now: Moment) -> bool {
        match &self.last_bid {
            Some(last_bid) => (now - last_bid.time) >= self.auction_duration,
            _ => false,
        }
    }
}

/// Auction alias type for simplification.
pub type Auction<T> = AuctionRecord<
    <T as frame_system::Trait>::AccountId,
    <T as pallet_timestamp::Trait>::Moment,
    BalanceOf<T>,
>;

/// Parameters, needed for auction start
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionParams<VideoId, Moment, Balance> {
    pub video_id: VideoId,
    pub auction_mode: AuctionMode,
    pub auction_duration: Moment,
    pub starting_price: Balance,
    pub minimal_bid_step: Balance,
    pub buy_now_price: Option<Balance>,
}
