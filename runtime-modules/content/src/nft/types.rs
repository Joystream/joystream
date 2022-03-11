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
    pub duration: BlockNumber,
    pub extension_period: BlockNumber,
    pub min_bid_step: Option<Balance>,
    pub top_bid: Option<EnglishBid>,
}

/// Open Auction
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OpenAuctionRecord<BlockNumber, AuctionId> {
    pub bid_lock_duration: BlockNumber,
    pub bids: u64,
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
pub enum AuctionType<EnglishAuction: Default, OpenAuction> {
    // English auction details
    English(EnglishAuction),
    // Open auction details
    Open(OpenAuction),
}

impl<EnglishAuction: Default, OpenAuction> Default for AuctionType<EnglishAuction, OpenAuction> {
    fn default() -> Self {
        Self::English(EnglishAuction::default())
    }
}

// Aliases
pub type Auction<T> =
    AuctionRecord<CurrencyOf<T>, <T as common::MembershipTypes>::MemberId, AuctionTypeOf<T>>;

pub type AuctionParams<T> =
    AuctionParamsRecord<AuctionTypeOf<T>, CurrencyOf<T>, <T as common::MembershipTypes>::MemberId>;

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

// old

// impl<
//         BlockNumber: BaseArithmetic + Copy + Default + Clone,
//         Balance: Default + BaseArithmetic + Clone,
//         MemberId: Default + PartialEq + Ord + Clone,
//     > AuctionRecord<BlockNumber, Balance, MemberId>
// {
//     /// Create a new auction record with provided parameters
//     pub fn new(auction_params: AuctionParams<BlockNumber, Balance, MemberId>) -> Self {
//         if let Some(starts_at) = auction_params.starts_at {
//             Self {
//                 starting_price: auction_params.starting_price,
//                 buy_now_price: auction_params.buy_now_price,
//                 auction_type: auction_params.auction_type,
//                 starts_at,
//                 whitelist: auction_params.whitelist,
//                 ..Default::default()
//             }
//         } else {
//             Self {
//                 starting_price: auction_params.starting_price,
//                 buy_now_price: auction_params.buy_now_price,
//                 auction_type: auction_params.auction_type,
//                 whitelist: auction_params.whitelist,
//                 ..Default::default()
//             }
//         }
//     }

//     /// Ensure new bid is greater then last bid + minimal bid step
//     pub fn ensure_is_valid_bid<T: Trait>(
//         &self,
//         new_bid: Balance,
//         participant_id: MemberId,
//         current_block: BlockNumber,
//     ) -> DispatchResult {
//         // 1. if bid >= Some(buy_now) -> Ok(())
//         if let Some(buy_now) = &self.buy_now_price {
//             if new_bid > *buy_now {
//                 return Ok(());
//             }
//         }

//         let old_bid_element = self.bid_list.get(&participant_id).map_or_else(
//             || -> Result<_, DispatchError> {
//                 ensure!(
//                     self.starting_price <= new_bid,
//                     Error::<T>::StartingPriceConstraintViolated
//                 );
//                 Ok(None)
//             },
//             |bid| Ok(Some(bid.clone())),
//         )?;

//         // 3. if type = English: bid >= (base_bid || start_price) + bid_step
//         match &self.auction_type {
//             AuctionType::English(EnglishAuctionRecord { bid_step, .. }) => {
//                 if let Some(Bid { amount, .. }) = old_bid_element {
//                     ensure!(
//                         amount.saturating_add(bid_step.clone()) <= new_bid,
//                         Error::<T>::BidStepConstraintViolated
//                     );
//                 }
//             }
//             AuctionType::Open(_) => {
//                 // smaller offer allowed only after locking duration
//                 if let Some(Bid {
//                     amount,
//                     made_at_block,
//                 }) = old_bid_element
//                 {
//                     if new_bid < amount {
//                         self.ensure_bid_lock_duration_expired::<T>(current_block, made_at_block)?
//                     }
//                 }
//             }
//         };

//         Ok(())
//     }

//     /// Make auction bid
//     pub fn make_bid(
//         &mut self,
//         bidder: MemberId,
//         amount: Balance,
//         last_bid_block: BlockNumber,
//     ) -> (bool, Bid<BlockNumber, Balance>) {
//         let bid = Bid::new(amount, last_bid_block);
//         let is_extended = match &mut self.auction_type {
//             AuctionType::English(EnglishAuctionRecord {
//                 extension_period,
//                 auction_duration,
//                 ..
//             }) if last_bid_block.saturating_add(*extension_period)
//                 >= self.starts_at.saturating_add(*auction_duration) =>
//             {
//                 // bump auction duration when bid is made during extension period.
//                 *auction_duration = auction_duration.saturating_add(*extension_period);
//                 true
//             }
//             _ => false,
//         };

//         let _ = self.bid_list.insert(bidder, bid.clone());
//         (is_extended, bid)
//     }

//     /// Ensure auction type is `Open`
//     pub fn ensure_is_open_auction<T: Trait>(&self) -> DispatchResult {
//         ensure!(
//             matches!(&self.auction_type, AuctionType::Open(_)),
//             Error::<T>::IsNotOpenAuctionType
//         );
//         Ok(())
//     }

//     /// Ensure auction type is `English`
//     pub fn ensure_is_english_auction<T: Trait>(&self) -> DispatchResult {
//         ensure!(
//             matches!(&self.auction_type, AuctionType::English(_)),
//             Error::<T>::IsNotEnglishAuctionType
//         );
//         Ok(())
//     }
// }
