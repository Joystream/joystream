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
    CuratorGroupId: Default + Copy,
    CuratorId: Default + Copy,
    MemberId: Default + Copy,
    Balance,
> {
    Idle,
    PendingTransferTo(MemberId),
    Auction(AuctionRecord<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>),
}

impl<
        AccountId,
        Moment: BaseArithmetic + Copy,
        CuratorGroupId: Default + Copy,
        CuratorId: Default + Copy,
        MemberId: Default + Copy,
        Balance,
    > Default
    for TransactionalStatus<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>
{
    fn default() -> Self {
        Self::Idle
    }
}

impl<
        AccountId: Default + PartialEq,
        Moment: BaseArithmetic + Copy,
        CuratorGroupId: Default + Copy,
        CuratorId: Default + Copy,
        MemberId: Default + Copy,
        Balance,
    > OwnedNFT<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>
{
    /// Create new vNFT
    pub fn new(owner: AccountId, creator_royalty: Option<(AccountId, Royalty)>) -> Self {
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
pub struct OwnedNFT<
    AccountId,
    Moment: BaseArithmetic + Copy,
    CuratorGroupId: Default + Copy,
    CuratorId: Default + Copy,
    MemberId: Default + Copy,
    Balance,
> {
    pub owner: AccountId,
    pub transactional_status:
        TransactionalStatus<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>,
    pub creator_royalty: Option<(AccountId, Royalty)>,
}

impl<
        AccountId: PartialEq,
        Moment: BaseArithmetic + Copy,
        CuratorGroupId: Default + Copy,
        CuratorId: Default + Copy,
        MemberId: Default + Copy,
        Balance,
    > OwnedNFT<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>
{
    pub fn is_owner(&self, account_id: &AccountId) -> bool {
        self.owner.eq(account_id)
    }
}

/// Enum, representing nft issuance status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NFTStatus<
    AccountId,
    Moment: BaseArithmetic + Copy,
    CuratorGroupId: Default + Copy,
    CuratorId: Default + Copy,
    MemberId: Default + Copy,
    Balance,
> {
    NoneIssued,
    Owned(OwnedNFT<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>),
}

impl<
        AccountId,
        Moment: BaseArithmetic + Copy,
        CuratorGroupId: Default + Copy,
        CuratorId: Default + Copy,
        MemberId: Default + Copy,
        Balance,
    > Default for NFTStatus<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>
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
pub struct AuctionRecord<
    AccountId,
    Moment: BaseArithmetic + Copy,
    CuratorGroupId: Default + Copy,
    CuratorId: Default + Copy,
    MemberId: Default + Copy,
    Balance,
> {
    pub auctioneer: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    pub auctioneer_account_id: AccountId,
    pub auction_mode: AuctionMode,
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub round_time: Moment,
    pub minimal_bid_step: Balance,
    pub last_bid_time: Moment,
    pub last_bid: Balance,
    pub last_bidder: AccountId,
}

impl<
        AccountId: Default + PartialEq,
        Moment: BaseArithmetic + Copy + Default,
        CuratorGroupId: Default + Copy + PartialEq,
        CuratorId: Default + Copy + PartialEq,
        MemberId: Default + Copy + PartialEq,
        Balance: Default + BaseArithmetic,
    > AuctionRecord<AccountId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>
{
    /// Create a new auction record with provided parameters
    pub fn new<VideoId>(
        auctioneer: ContentActor<CuratorGroupId, CuratorId, MemberId>,
        auctioneer_account_id: AccountId,
        auction_params: AuctionParams<VideoId, Moment, Balance>,
    ) -> Self {
        let AuctionParams {
            auction_mode,
            round_time,
            starting_price,
            buy_now_price,
            minimal_bid_step,
            ..
        } = auction_params;
        Self {
            auctioneer,
            auctioneer_account_id,
            auction_mode,
            starting_price,
            buy_now_price,
            round_time,
            minimal_bid_step,
            last_bid_time: Moment::default(),
            last_bid: Balance::default(),
            last_bidder: AccountId::default(),
        }
    }

    /// Ensure new bid is greater then last bid + minimal bid step
    pub fn ensure_is_valid_bid<T: Trait>(&self, new_bid: Balance) -> DispatchResult {
        // Always allow to buy now
        match &self.buy_now_price {
            Some(buy_now_price) if new_bid >= *buy_now_price => (),
            // Ensure new bid is greater then last bid + minimal bid step
            _ => ensure!(
                self.last_bid
                    .checked_add(&self.minimal_bid_step)
                    .ok_or(Error::<T>::OverflowOrUnderflowHappened)?
                    < new_bid,
                Error::<T>::InvalidBid
            ),
        }

        Ok(())
    }

    /// Make auction bid
    pub fn make_bid<T: Trait>(
        mut self,
        who: AccountId,
        bid: Balance,
        last_bid_time: Moment,
    ) -> Self {
        self.last_bidder = who;
        self.last_bid = bid;
        self.last_bid_time = last_bid_time;
        self
    }

    // We assume that default AccountId can not make any bids
    fn is_active(&self) -> bool {
        self.last_bidder.eq(&AccountId::default())
    }

    /// Ensure auction is not active
    pub fn ensure_is_not_active<T: Trait>(&self) -> DispatchResult {
        ensure!(self.is_active(), Error::<T>::ActionIsAlreadyActive);
        Ok(())
    }

    /// Ensure provided account id is auctioneer
    pub fn ensure_is_auctioneer<T: Trait>(
        &self,
        auctioneer: &ContentActor<CuratorGroupId, CuratorId, MemberId>,
    ) -> DispatchResult {
        ensure!(
            self.auctioneer.eq(auctioneer),
            Error::<T>::ActorIsNotAnAuctioneer
        );
        Ok(())
    }
}

/// Auction alias type for simplification.
pub type Auction<T> = AuctionRecord<
    <T as frame_system::Trait>::AccountId,
    <T as pallet_timestamp::Trait>::Moment,
    CuratorGroupId<T>,
    CuratorId<T>,
    MemberId<T>,
    BalanceOf<T>,
>;

/// Parameters, needed for auction start
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionParams<VideoId, Moment, Balance> {
    pub video_id: VideoId,
    pub auction_mode: AuctionMode,
    pub round_time: Moment,
    pub starting_price: Balance,
    pub minimal_bid_step: Balance,
    pub buy_now_price: Option<Balance>,
}
