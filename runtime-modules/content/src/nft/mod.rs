mod types;
use sp_std::borrow::ToOwned;
pub use types::*;

use crate::*;

impl<T: Trait> Module<T> {
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

    /// Safety/bound checks for english auction parameters
    pub(crate) fn validate_english_auction_params(
        auction_params: &EnglishAuctionParams<T>,
    ) -> DispatchResult {
        Self::ensure_auction_duration_bounds_satisfied(auction_params.auction_duration)?;
        Self::ensure_extension_period_bounds_satisfied(auction_params.extension_period)?;

        Self::ensure_bid_step_bounds_satisfied(auction_params.min_bid_step)?;

        // Ensure auction_duration of English auction is >= extension_period
        ensure!(
            auction_params.auction_duration >= auction_params.extension_period,
            Error::<T>::ExtensionPeriodIsGreaterThenAuctionDuration
        );

        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;

        Self::ensure_whitelist_bounds_satisfied(&auction_params.whitelist)?;

        if let Some(buy_now_price) = auction_params.buy_now_price {
            ensure!(
                buy_now_price > auction_params.starting_price,
                Error::<T>::BuyNowIsLessThenStartingPrice
            );
        }

        Ok(())
    }

    /// Safety/bound checks for english auction parameters
    pub(crate) fn validate_open_auction_params(
        auction_params: &OpenAuctionParams<T>,
    ) -> DispatchResult {
        Self::ensure_bid_lock_duration_bounds_satisfied(auction_params.bid_lock_duration)?;

        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;

        Self::ensure_whitelist_bounds_satisfied(&auction_params.whitelist)?;

        if let Some(buy_now_price) = auction_params.buy_now_price {
            ensure!(
                buy_now_price > auction_params.starting_price,
                Error::<T>::BuyNowIsLessThenStartingPrice
            );
        }

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

        Nft::<T> {
            transactional_status: TransactionalStatus::<T>::Idle,
            ..nft
        }
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

        Nft::<T> {
            transactional_status: TransactionalStatus::<T>::Idle,
            ..nft
        }
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

    pub(crate) fn complete_auction(
        video_id: T::VideoId,
        winner_id: T::MemberId,
        amount: CurrencyOf<T>,
    ) -> Result<Nft<T>, DispatchError> {
        let Video::<T> {
            in_channel,
            nft_status,
            ..
        } = Self::video_by_id(video_id);
        let nft = nft_status.unwrap();

        let dest_account_id = Self::ensure_owner_account_id(in_channel, &nft)?;
        let src_account_id = T::MemberAuthenticator::controller_account_id(winner_id)?;

        Self::complete_payment(
            in_channel,
            nft.creator_royalty,
            amount,
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
            transactional_status: TransactionalStatus::<T>::Idle,
            ..nft.clone()
        }
    }

    // fetches the desginated nft owner account, preconditions:
    // 1. Self::ensure_channel_exist(channel_id).is_ok()
    pub(crate) fn ensure_owner_account_id(
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

    pub(crate) fn ensure_nft_exists(video_id: T::VideoId) -> Result<Nft<T>, Error<T>> {
        Self::ensure_video_exists(&video_id).and_then(|video| video.ensure_nft_is_issued::<T>())
    }

    // NFT
    /// Get nft english auction record
    pub(crate) fn ensure_english_auction_state(
        nft: &Nft<T>,
    ) -> Result<EnglishAuction<T>, DispatchError> {
        if let TransactionalStatus::<T>::EnglishAuction(auction) = &nft.transactional_status {
            Ok(auction.to_owned())
        } else {
            Err(Error::<T>::IsNotEnglishAuctionType.into())
        }
    }

    /// Get nft open auction record
    pub(crate) fn ensure_open_auction_state(nft: &Nft<T>) -> Result<OpenAuction<T>, DispatchError> {
        if let TransactionalStatus::<T>::OpenAuction(auction) = &nft.transactional_status {
            Ok(auction.to_owned())
        } else {
            Err(Error::<T>::IsNotOpenAuctionType.into())
        }
    }

    ///  Ensure nft transactional status is set to `Idle`
    pub(crate) fn ensure_nft_transactional_status_is_idle(nft: &Nft<T>) -> DispatchResult {
        if let TransactionalStatus::<T>::Idle = nft.transactional_status {
            Ok(())
        } else {
            Err(Error::<T>::NftIsNotIdle.into())
        }
    }

    /// Ensure Nft has pending offer
    pub(crate) fn ensure_pending_offer_state(nft: &Nft<T>) -> DispatchResult {
        ensure!(
            matches!(
                nft.transactional_status,
                TransactionalStatus::<T>::InitiatedOfferToMember(..),
            ),
            Error::<T>::PendingOfferDoesNotExist
        );
        Ok(())
    }

    /// Ensure Nft is in BuyNow state
    pub(crate) fn ensure_buy_now_state(nft: &Nft<T>) -> DispatchResult {
        ensure!(
            matches!(
                nft.transactional_status,
                TransactionalStatus::<T>::BuyNow(..),
            ),
            Error::<T>::NftNotInBuyNowState
        );
        Ok(())
    }
}
