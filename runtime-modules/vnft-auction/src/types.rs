use super::*;

// Metadata for vNFT issuance
type Metadata = Vec<u8>;

pub type BalanceOf<T> =
    <<T as Trait>::NftCurrencyProvider as Currency<<T as frame_system::Trait>::AccountId>>::Balance;

pub type CuratorGroupId<T> = <T as ContentActorAuthenticator>::CuratorGroupId;
pub type CuratorId<T> = <T as ContentActorAuthenticator>::CuratorId;
pub type MemberId<T> = <T as MembershipTypes>::MemberId;

// Owner royalty
pub type Royalty = Perbill;

// Either new auction, which requires vNFT issance or auction for already existing nft.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AuctionMode<VNFTId: Default> {
    // Auction, where nft issued at the end
    WithIssuance(Option<Royalty>, Metadata),
    // Auction for already existing nft
    WithoutIsuance(VNFTId),
}

impl<VNFTId: Default> Default for AuctionMode<VNFTId> {
    fn default() -> Self {
        Self::WithoutIsuance(VNFTId::default())
    }
}

/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionRecord<
    AccountId,
    VNFTId: Default,
    Moment: BaseArithmetic + Copy,
    CuratorGroupId: Default + Copy,
    CuratorId: Default + Copy,
    MemberId: Default + Copy,
    Balance,
> {
    pub auctioneer: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    pub auctioneer_account_id: AccountId,
    pub auction_mode: AuctionMode<VNFTId>,
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
        VNFTId: Default,
        Moment: BaseArithmetic + Copy + Default,
        CuratorGroupId: Default + Copy + PartialEq,
        CuratorId: Default + Copy + PartialEq,
        MemberId: Default + Copy + PartialEq,
        Balance: Default + BaseArithmetic,
    > AuctionRecord<AccountId, VNFTId, Moment, CuratorGroupId, CuratorId, MemberId, Balance>
{
    pub fn new<VideoId>(
        auctioneer: ContentActor<CuratorGroupId, CuratorId, MemberId>,
        auctioneer_account_id: AccountId,
        auction_params: AuctionParams<VNFTId, VideoId, Moment, Balance>,
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

    pub fn ensure_is_not_active<T: Trait>(&self) -> DispatchResult {
        ensure!(self.is_active(), Error::<T>::ActionIsActive);
        Ok(())
    }

    pub fn ensure_is_auctioneer<T: Trait>(
        &self,
        auctioneer: &ContentActor<CuratorGroupId, CuratorId, MemberId>,
    ) -> DispatchResult {
        ensure!(
            self.auctioneer.eq(auctioneer),
            Error::<T>::ActorIsNotAuctioneer
        );
        Ok(())
    }
}

/// Auction alias type for simplification.
pub type Auction<T> = AuctionRecord<
    <T as frame_system::Trait>::AccountId,
    <T as Trait>::VNFTId,
    <T as timestamp::Trait>::Moment,
    CuratorGroupId<T>,
    CuratorId<T>,
    MemberId<T>,
    BalanceOf<T>,
>;

/// Parameters, needed for auction start
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionParams<VNFTId: Default, VideoId, Moment, Balance> {
    pub auction_mode: AuctionMode<VNFTId>,
    pub video_id: VideoId,
    pub round_time: Moment,
    pub starting_price: Balance,
    pub minimal_bid_step: Balance,
    pub buy_now_price: Option<Balance>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VNFT<AccountId: Default> {
    pub owner: AccountId,
    pub creator_royalty: Option<(AccountId, Royalty)>,
}

impl<AccountId: Default> VNFT<AccountId> {
    pub fn new(owner: AccountId, creator_royalty: Option<(AccountId, Royalty)>) -> Self {
        Self {
            owner,
            creator_royalty,
        }
    }
}
