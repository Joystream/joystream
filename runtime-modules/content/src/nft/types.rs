use super::*;

/// Metadata for NFT issuance
pub type NftMetadata = Vec<u8>;

/// Owner royalty
pub type Royalty = Perbill;

/// Nft transactional status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum TransactionalStatusRecord<MemberId, Balance, AuctionType> {
    Idle,
    InitiatedOfferToMember(MemberId, Option<Balance>),
    Auction(AuctionType),
    BuyNow(Balance),
}

impl<MemberId, Balance, AuctionType> Default
    for TransactionalStatusRecord<MemberId, Balance, AuctionType>
{
    fn default() -> Self {
        Self::Idle
    }
}

pub type TransactionalStatus<T> =
    TransactionalStatusRecord<<T as common::MembershipTypes>::MemberId, CurrencyOf<T>, Auction<T>>;

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

/// Parameters, needed for auction start
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionParamsRecord<AuctionType, Balance, MemberId: Ord> {
    // Auction type (either english or open)
    pub auction_type: AuctionType,
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub whitelist: BTreeSet<MemberId>,
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
pub enum InitTransactionalStatusRecord<AuctionParams, MemberId, Balance> {
    Idle,
    BuyNow(Balance),
    InitiatedOfferToMember(MemberId, Option<Balance>),
    Auction(AuctionParams),
}

impl<AuctionParams, MemberId, Balance> Default
    for InitTransactionalStatusRecord<AuctionParams, MemberId, Balance>
{
    fn default() -> Self {
        Self::Idle
    }
}

pub type InitTransactionalStatus<T> = InitTransactionalStatusRecord<
    AuctionParams<T>,
    <T as common::MembershipTypes>::MemberId,
    CurrencyOf<T>,
>;

/// Information on the auction being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AuctionRecord<Balance, MemberId: Ord, AuctionType> {
    pub starting_price: Balance,
    pub buy_now_price: Option<Balance>,
    pub auction_type: AuctionType,
    pub whitelist: BTreeSet<MemberId>,
}

impl<Balance, MemberId: Ord, AuctionType> AuctionRecord<Balance, MemberId, AuctionType> {
    pub fn new(params: AuctionParamsRecord<AuctionType, Balance, MemberId>) -> Self {
        Self {
            starting_price: params.starting_price,
            buy_now_price: params.buy_now_price,
            auction_type: params.auction_type,
            whitelist: params.whitelist,
        }
    }
}

/// English Auction
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishAuctionRecord<BlockNumber, Balance, EnglishBid> {
    pub end: BlockNumber,
    pub auction_duration: BlockNumber,
    pub extension_period: BlockNumber,
    pub min_bid_step: Balance,
    pub top_bid: Option<EnglishBid>,
}

/// Open Auction
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionRecord<BlockNumber, AuctionId> {
    pub bid_lock_duration: BlockNumber,
    pub auction_id: AuctionId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenBidRecord<Balance, BlockNumber, AuctionId> {
    pub amount: Balance,
    pub made_at_block: BlockNumber,
    pub auction_id: AuctionId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EnglishBidRecord<Balance, MemberId> {
    pub amount: Balance,
    pub bidder_id: MemberId,
}

/// Auction type
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AuctionType<EnglishAuctionParams: Default, OpenAuctionParams> {
    // English auction details
    English(EnglishAuctionParams),
    // Open auction details
    Open(OpenAuctionParams),
}

impl<EnglishAuction: Default, OpenAuction> Default for AuctionType<EnglishAuction, OpenAuction> {
    fn default() -> Self {
        Self::English(EnglishAuction::default())
    }
}

// Aliases
pub type Auction<T> =
    AuctionRecord<CurrencyOf<T>, <T as common::MembershipTypes>::MemberId, AuctionTypeOf<T>>;

pub type AuctionParams<T> = AuctionParamsRecord<
    AuctionType<EnglishAuction<T>, <T as frame_system::Trait>::BlockNumber>,
    CurrencyOf<T>,
    <T as common::MembershipTypes>::MemberId,
>;

pub type EnglishAuction<T> = EnglishAuctionRecord<
    <T as frame_system::Trait>::BlockNumber,
    CurrencyOf<T>,
    EnglishBidRecord<CurrencyOf<T>, <T as common::MembershipTypes>::MemberId>,
>;

pub type OpenAuction<T> =
    OpenAuctionRecord<<T as frame_system::Trait>::BlockNumber, <T as Trait>::OpenAuctionId>;

pub type AuctionTypeOf<T> = AuctionType<EnglishAuction<T>, OpenAuction<T>>;

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
