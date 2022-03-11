mod types;
use sp_std::borrow::ToOwned;
pub use types::*;

use crate::*;

impl<T: Trait> Module<T> {
    /// Ensure nft auction can be completed
    pub(crate) fn ensure_auction_can_be_completed(auction: &Auction<T>) -> DispatchResult {
        let can_be_completed = if let AuctionType::English(EnglishAuctionDetails {
            auction_duration,
            ..
        }) = auction.auction_type
        {
            let now = <frame_system::Module<T>>::block_number();

            // Check whether auction time expired.
            (now - auction.starts_at) >= auction_duration
        } else {
            // Open auction can be completed at any time
            true
        };

        ensure!(can_be_completed, Error::<T>::AuctionCannotBeCompleted);

        Ok(())
    }

    /// Ensure auction participant has sufficient balance to make bid
    pub(crate) fn ensure_has_sufficient_balance(
        participant: &T::AccountId,
        bid: CurrencyOf<T>,
    ) -> DispatchResult {
        ensure!(
            T::Currency::total_balance(participant) >= bid,
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Safety/bound checks for auction parameters
    pub(crate) fn validate_auction_params(
        auction_params: &AuctionParams<T::BlockNumber, CurrencyOf<T>, T::MemberId>,
    ) -> DispatchResult {
        match auction_params.auction_type {
            AuctionType::English(EnglishAuctionDetails {
                extension_period,
                auction_duration,
                bid_step,
            }) => {
                Self::ensure_auction_duration_bounds_satisfied(auction_duration)?;
                Self::ensure_extension_period_bounds_satisfied(extension_period)?;

                Self::ensure_bid_step_bounds_satisfied(bid_step)?;

                // Ensure auction_duration of English auction is >= extension_period
                ensure!(
                    auction_duration >= extension_period,
                    Error::<T>::ExtensionPeriodIsGreaterThenAuctionDuration
                );
            }
            AuctionType::Open(OpenAuctionDetails { bid_lock_duration }) => {
                Self::ensure_bid_lock_duration_bounds_satisfied(bid_lock_duration)?;
            }
        }

        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;

        Self::ensure_whitelist_bounds_satisfied(&auction_params.whitelist)?;

        if let Some(starts_at) = auction_params.starts_at {
            Self::ensure_starts_at_delta_bounds_satisfied(starts_at)?;
        }

        if let Some(buy_now_price) = auction_params.buy_now_price {
            ensure!(
                buy_now_price > auction_params.starting_price,
                Error::<T>::BuyNowIsLessThenStartingPrice
            );
        }

        Ok(())
    }

    /// Ensure starts at bounds satisfied
    pub(crate) fn ensure_starts_at_delta_bounds_satisfied(
        starts_at: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            starts_at >= <frame_system::Module<T>>::block_number(),
            Error::<T>::StartsAtLowerBoundExceeded
        );

        ensure!(
            starts_at
                <= <frame_system::Module<T>>::block_number() + Self::auction_starts_at_max_delta(),
            Error::<T>::StartsAtUpperBoundExceeded
        );

        Ok(())
    }

    /// Ensure royalty bounds satisfied
    pub(crate) fn ensure_royalty_bounds_satisfied(royalty: Perbill) -> DispatchResult {
        ensure!(
            royalty <= Self::max_creator_royalty(),
            Error::<T>::RoyaltyUpperBoundExceeded
        );
        ensure!(
            royalty >= Self::min_creator_royalty(),
            Error::<T>::RoyaltyLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure bid step bounds satisfied
    pub(crate) fn ensure_bid_step_bounds_satisfied(bid_step: CurrencyOf<T>) -> DispatchResult {
        ensure!(
            bid_step <= Self::max_bid_step(),
            Error::<T>::AuctionBidStepUpperBoundExceeded
        );
        ensure!(
            bid_step >= Self::min_bid_step(),
            Error::<T>::AuctionBidStepLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure whitelist bounds satisfied
    pub(crate) fn ensure_whitelist_bounds_satisfied(
        whitelist: &BTreeSet<T::MemberId>,
    ) -> DispatchResult {
        match whitelist.len() {
            // whitelist is empty <==> feature is not active.
            0 => Ok(()),
            // auctions with one paticipant does not makes sense
            1 => Err(Error::<T>::WhitelistHasOnlyOneMember.into()),
            length => {
                ensure!(
                    length <= Self::max_auction_whitelist_length() as usize,
                    Error::<T>::MaxAuctionWhiteListLengthUpperBoundExceeded
                );
                Ok(())
            }
        }
    }

    /// Ensure auction duration bounds satisfied
    pub(crate) fn ensure_auction_duration_bounds_satisfied(
        duration: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            duration <= Self::max_auction_duration(),
            Error::<T>::AuctionDurationUpperBoundExceeded
        );
        ensure!(
            duration >= Self::min_auction_duration(),
            Error::<T>::AuctionDurationLowerBoundExceeded
        );

        Ok(())
    }

    /// Ensure auction extension period bounds satisfied
    pub(crate) fn ensure_extension_period_bounds_satisfied(
        extension_period: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            extension_period <= Self::max_auction_extension_period(),
            Error::<T>::ExtensionPeriodUpperBoundExceeded
        );
        ensure!(
            extension_period >= Self::min_auction_extension_period(),
            Error::<T>::ExtensionPeriodLowerBoundExceeded
        );

        Ok(())
    }

    /// Ensure bid lock duration bounds satisfied
    pub(crate) fn ensure_bid_lock_duration_bounds_satisfied(
        bid_lock_duration: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            bid_lock_duration <= Self::max_bid_lock_duration(),
            Error::<T>::BidLockDurationUpperBoundExceeded
        );
        ensure!(
            bid_lock_duration >= Self::min_bid_lock_duration(),
            Error::<T>::BidLockDurationLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure royalty bounds satisfied
    pub(crate) fn ensure_starting_price_bounds_satisfied(
        starting_price: CurrencyOf<T>,
    ) -> DispatchResult {
        ensure!(
            starting_price >= Self::min_starting_price(),
            Error::<T>::StartingPriceLowerBoundExceeded
        );
        ensure!(
            starting_price <= Self::max_starting_price(),
            Error::<T>::StartingPriceUpperBoundExceeded
        );
        Ok(())
    }

    /// Ensure given participant have sufficient free balance
    pub(crate) fn ensure_sufficient_free_balance(
        participant_account_id: &T::AccountId,
        balance: CurrencyOf<T>,
    ) -> DispatchResult {
        ensure!(
            T::Currency::can_slash(participant_account_id, balance),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Ensure given participant can buy nft now
    pub(crate) fn ensure_can_buy_now(
        nft: &Nft<T>,
        participant_account_id: &T::AccountId,
    ) -> DispatchResult {
        if let TransactionalStatus::<T>::BuyNow(price) = &nft.transactional_status {
            Self::ensure_sufficient_free_balance(participant_account_id, *price)
        } else {
            Err(Error::<T>::NftNotInBuyNowState.into())
        }
    }

    /// Ensure new pending offer for given participant is available to proceed
    pub(crate) fn ensure_new_pending_offer_available_to_proceed(
        nft: &Nft<T>,
        participant_account_id: &T::AccountId,
    ) -> DispatchResult {
        if let TransactionalStatus::<T>::InitiatedOfferToMember(member_id, price) =
            &nft.transactional_status
        {
            // Authorize participant under given member id
            ensure_member_auth_success::<T>(participant_account_id, &member_id)?;

            if let Some(price) = price {
                Self::ensure_sufficient_free_balance(participant_account_id, *price)?;
            }
            Ok(())
        } else {
            Err(Error::<T>::PendingOfferDoesNotExist.into())
        }
    }

    /// Buy nft
    pub(crate) fn buy_now(
        in_channel: T::ChannelId,
        mut nft: Nft<T>,
        owner_account_id: T::AccountId,
        new_owner_account_id: T::AccountId,
        new_owner: T::MemberId,
    ) -> Nft<T> {
        if let TransactionalStatus::<T>::BuyNow(price) = &nft.transactional_status {
            Self::complete_payment(
                in_channel,
                nft.creator_royalty,
                *price,
                new_owner_account_id,
                Some(owner_account_id),
                false,
            );

            nft.owner = NftOwner::Member(new_owner);
        }

        nft.set_idle_transactional_status()
    }

    /// Completes nft offer
    pub(crate) fn complete_nft_offer(
        in_channel: T::ChannelId,
        mut nft: Nft<T>,
        owner_account_id: T::AccountId,
        new_owner_account_id: T::AccountId,
    ) -> Nft<T> {
        if let TransactionalStatus::<T>::InitiatedOfferToMember(to, price) =
            &nft.transactional_status
        {
            if let Some(price) = price {
                Self::complete_payment(
                    in_channel,
                    nft.creator_royalty,
                    *price,
                    new_owner_account_id,
                    Some(owner_account_id),
                    false,
                );
            }

            nft.owner = NftOwner::Member(*to);
        }

        nft.set_idle_transactional_status()
    }

    /// Complete payment, either auction related or buy now/offer
    pub(crate) fn complete_payment(
        in_channel: T::ChannelId,
        creator_royalty: Option<Royalty>,
        amount: CurrencyOf<T>,
        sender_account_id: T::AccountId,
        receiver_account_id: Option<T::AccountId>,
        // for auction related payments
        is_auction: bool,
    ) {
        let auction_fee = Self::platform_fee_percentage() * amount;

        // Slash amount from sender
        if is_auction {
            T::Currency::slash_reserved(&sender_account_id, amount);
        } else {
            T::Currency::slash(&sender_account_id, amount);
        }

        if let Some(creator_royalty) = creator_royalty {
            let royalty = creator_royalty * amount;

            // Deposit amount, exluding royalty and platform fee into receiver account
            match receiver_account_id {
                Some(receiver_account_id) if amount > royalty + auction_fee => {
                    T::Currency::deposit_creating(
                        &receiver_account_id,
                        amount - royalty - auction_fee,
                    );
                }
                Some(receiver_account_id) => {
                    T::Currency::deposit_creating(&receiver_account_id, amount - auction_fee);
                }
                _ => (),
            };

            // Should always be Some(_) at this stage, because of previously made check.
            if let Some(creator_account_id) = Self::channel_by_id(in_channel).reward_account {
                // Deposit royalty into creator account
                T::Currency::deposit_creating(&creator_account_id, royalty);
            }
        } else if let Some(receiver_account_id) = receiver_account_id {
            // Deposit amount, exluding auction fee into receiver account
            T::Currency::deposit_creating(&receiver_account_id, amount - auction_fee);
        }
    }

    /// Complete auction, assumptions:
    /// 1. video.nft_status.is_some()
    /// 2. matches!(video.nft_status, TransactionalStatus::<T>::Auction)
    pub(crate) fn complete_auction(
        channel_id: T::ChannelId,
        nft: &Nft<T>,
        winner_id: T::MemberId,
        claimed_amount: CurrencyOf<T>,
    ) -> Result<Nft<T>, DispatchError> {
        let dest_account_id = Self::ensure_owner_account_id(channel_id, nft)?;
        let src_account_id = T::MemberAuthenticator::controller_account_id(winner_id)?;

        if let TransactionalStatus::<T>::Auction(Auction::<T> { bid_list, .. }) =
            &nft.transactional_status
        {
            assert!(bid_list.contains_key(&winner_id));
            ensure!(
                bid_list
                    .get(&winner_id)
                    .map_or(false, |bid| { bid.amount == claimed_amount }),
                Error::<T>::InvalidBidAmountSpecified
            );
        }

        Self::complete_payment(
            channel_id,
            nft.creator_royalty,
            claimed_amount,
            src_account_id,
            Some(dest_account_id),
            true,
        );

        Ok(Self::cancel_transaction(&nft, Some(winner_id)))
    }

    pub(crate) fn cancel_transaction(nft: &Nft<T>, winner: Option<T::MemberId>) -> Nft<T> {
        // set owner & idle transactional status
        Nft::<T> {
            owner: winner.map_or(nft.owner.to_owned(), |winner_id| {
                NftOwner::Member(winner_id)
            }),
            creator_royalty: nft.creator_royalty,
            transactional_status: TransactionalStatus::<T>::Idle,
        }
    }

    // fetches the desginated nft owner account, preconditions:
    // 1. Self::ensure_channel_exist(channel_id).is_ok()
    pub(crate) fn ensure_owner_account_id<T: Trait>(
        channel_id: T::ChannelId,
        nft: &Nft<T>,
    ) -> Result<T::AccountId, DispatchError> {
        match nft.owner {
            NftOwner::Member(member_id) => T::MemberAuthenticator::controller_account_id(member_id),
            NftOwner::ChannelOwner => Self::channel_by_id(channel_id)
                .reward_account
                .ok_or_else(|| Error::<T>::RewardAccountIsNotSet.into()),
        }
    }

    pub(crate) fn ensure_whitelisted_participant<T: Trait>(
        auction: &Auction<T>,
        participant_id: T::MemberId,
    ) -> DispatchResult {
        ensure!(
            auction.whitelist().is_empty() || auction.whitelist().contains(participant_id),
            Error::<T>::MemberIsNotAllowedToParticipate
        );
        Ok(())
    }

    pub(crate) fn ensure_auction_has_no_bids<T: Trait>(&auction: Auction<T>) -> DispatchResult {
        match &auction.auction_type {
            AuctionTypeOf::<T>::English(eng) => {
                ensure!(eng.top_bid.is_none(), Error::<T>::ActionHasBidsAlready)
            }
            AuctionTypeOf::<T>::Open(open) => {
                ensure!(open.bids == 0, Error::<T>::ActionHasBidsAlready)
            }
        }
        Ok(())
    }

    pub(crate) fn ensure_auction_has_no_bids<T: Trait>(&auction: Auction<T>) -> DispatchResult {
        ensure_auction_has_no_bids(auction)
    }

    pub(crate) fn ensure_nft_auction_not_expired<T: Trait>(&nft: Nft<T>) -> DispatchResult {
        let now = <frame_system::Module<T>>::block_number();
        if let TransactionalStatus::<T>::Auction(Auction::<T> { auction_type, .. }) =
            nft.transactional_status
        {
            match auction_type {
                AuctionTypeOf::<T>::English(eng) => {
                    ensure!(eng.end > now, Error::<T>::NftAuctionIsAlreadyExpired,)
                }
                AuctionTypeOf::<T>::Open(open) => ensure!(
                    nft_auction_status == open_auction,
                    Error::<T>::NftAuctionIsAlreadyExpired,
                ),
            }
        } else {
            Err(Error::<T>::NotInAuctionState.into())
        }

        Ok(())
    }

    pub(crate) fn ensure_bid_can_be_made<T: Trait>(
        auction: &Auction<T>,
        bidder: T::MemberId,
        amount: CurrencyOf<T>,
        video_id: T::VideoId,
    ) -> DispatchResult {
        // 1. if bid >= Some(buy_now) -> Ok(())
        if let Some(buy_now) = &self.buy_now_price {
            if new_bid > *buy_now {
                return Ok(());
            }
        };

        match &auction.auction_type {
            AuctionTypeOf::<T>::English(EnglishAuction::<T> { top_bid, .. }) => top_bid
                .map_or_else(
                    || {
                        ensure!(
                            auction.starting_price <= amount,
                            Error::<T>::StartingPriceConstraintViolated,
                        );
                        Ok(())
                    },
                    |bid| {
                        ensure!(
                            bid.amount.saturating_add(bid_step.clone()) <= amount,
                            Error::<T>::BidStepConstraintViolated
                        );
                        Ok(())
                    },
                ),
            AuctionTypeOf::<T>::Open(open) => Self::ensure_bid_exists(&video_id, &member_id)
                .map_or_else(
                    || {
                        ensure!(
                            auction.starting_price <= amount
                                Error::<T>::StartingPriceConstraintViolated,
                        );
                        Ok(())
                    },
                    |bid| {
                        if amount < bid.amount {
                            ensure_bid_lock_duration_expired::<T>(&open, bid.made_at_block)
                        }
                    },
                ),
        }
    }

    pub(crate) fn ensure_bid_lock_duration_expired<T: Trait>(
        open_auction: &OpenAuction<T>,
        last_bid_block: <T as frame_system::Trait>::BlockNumber,
    ) -> DispatchResult {
        let now = <frame_system::Module<T>>::block_number();
        ensure!(
            last_bid_block.saturating_add(auction.bid_lock_duration) >= now,
            Error::<T>::BidLockDurationIsNotExpired
        );
        Ok(())
    }

    pub(crate) fn ensure_nft_exists<T: Trait>(
        video_id: T::VideoId,
    ) -> Result<Nft<T>, DispatchError> {
        Self::video_by_id(nft_video_id).and_then(|video| video.ensure_nft_is_issued::<T>())
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

    /// Ensure bid can be cancelled
    pub fn ensure_bid_can_be_canceled<T: Trait>(
        who: MemberId,
        nft_video_id: T::VideoId,
    ) -> DispatchResult {
        let nft = Self::ensure_nft_exists(nft_video_id)?;
        let bid = Self::ensure_bid_exists(nft_video_id, who)?;

        match nft.transactional_status {
            Auction::<T> {
                auction_type: AuctionTypeOf::<T>::Open(open),
                ..
            } if open.auction_id == bid.auction_id => {
                ensure_bid_lock_duration_expired::<T>(&open, bid.made_at_block)
            }
            _ => Ok(()),
        }
    }
}
