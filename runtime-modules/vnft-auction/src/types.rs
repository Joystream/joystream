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
    pub last_bid_time: Moment,
    pub current_bid: Balance,
    pub current_bidder: AccountId,
}

impl<
        AccountId: Default,
        VNFTId: Default,
        Moment: BaseArithmetic + Copy + Default,
        CuratorGroupId: Default + Copy,
        CuratorId: Default + Copy,
        MemberId: Default + Copy,
        Balance: Default,
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
            ..
        } = auction_params;
        Self {
            auctioneer,
            auctioneer_account_id,
            auction_mode,
            starting_price,
            buy_now_price,
            round_time,
            last_bid_time: Moment::default(),
            current_bid: Balance::default(),
            current_bidder: AccountId::default(),
        }
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
