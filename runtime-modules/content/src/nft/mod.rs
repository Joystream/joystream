mod types;
use common::costs::{burn_from_usable, has_sufficient_balance_for_payment};
use sp_std::borrow::ToOwned;
use sp_std::cmp::min;
pub use types::*;

use crate::*;

impl<T: Config> Module<T> {
    pub(crate) fn ensure_has_sufficient_balance_for_bid(
        participant: &T::AccountId,
        bid: BalanceOf<T>,
        old_bid: Option<BalanceOf<T>>,
    ) -> DispatchResult {
        let old_bid = old_bid.unwrap_or_else(Zero::zero);

        ensure!(
            has_sufficient_balance_for_payment::<T>(participant, bid.saturating_sub(old_bid)),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Make bid transfer to the treasury account or get refunded if the old bid is greater than a new one.
    pub(crate) fn transfer_bid_to_treasury(
        participant: &T::AccountId,
        bid: BalanceOf<T>,
        old_bid: Option<BalanceOf<T>>,
    ) -> DispatchResult {
        if let Some(old_bid) = old_bid {
            if bid >= old_bid {
                // Deposit the difference to the module account.
                let bid_diff_amount = bid.saturating_sub(old_bid);
                ContentTreasury::<T>::deposit(participant, bid_diff_amount)
            } else {
                // Withdraw the difference from the module account.
                let bid_diff_amount = old_bid.saturating_sub(bid);
                ContentTreasury::<T>::withdraw(participant, bid_diff_amount)
            }
        } else {
            ContentTreasury::<T>::deposit(participant, bid)
        }
    }

    /// Withdraw the bid from the treasury account.
    pub(crate) fn withdraw_bid_payment(
        participant: &T::AccountId,
        bid: BalanceOf<T>,
    ) -> DispatchResult {
        ContentTreasury::<T>::withdraw(participant, bid)
    }

    /// Safety/bound checks for english auction parameters
    pub(crate) fn validate_english_auction_params(
        auction_params: &EnglishAuctionParams<T>,
    ) -> DispatchResult {
        // infere auction duration from params & current block
        let auction_duration = auction_params.duration;
        Self::ensure_auction_duration_bounds_satisfied(auction_duration)?;
        Self::ensure_extension_period_bounds_satisfied(auction_params.extension_period)?;

        Self::ensure_bid_step_bounds_satisfied(auction_params.min_bid_step)?;

        // Ensure auction_duration of English auction is >= extension_period
        ensure!(
            auction_duration >= auction_params.extension_period,
            Error::<T>::ExtensionPeriodIsGreaterThenAuctionDuration
        );

        // validate forward start limits
        if let Some(starts_at) = auction_params.starts_at {
            Self::ensure_starts_at_delta_bounds_satisfied(starts_at)?;
        }

        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;

        Self::ensure_whitelist_bounds_satisfied(&auction_params.whitelist)?;

        Self::ensure_whitelist_members_exist(&auction_params.whitelist)?;

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

        Self::ensure_whitelist_members_exist(&auction_params.whitelist)?;

        // validate forward start limits
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
            starts_at >= <frame_system::Pallet<T>>::block_number(),
            Error::<T>::StartsAtLowerBoundExceeded
        );

        ensure!(
            starts_at
                <= <frame_system::Pallet<T>>::block_number() + Self::auction_starts_at_max_delta(),
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
    pub(crate) fn ensure_bid_step_bounds_satisfied(bid_step: BalanceOf<T>) -> DispatchResult {
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

    pub(crate) fn ensure_whitelist_members_exist(
        whitelist: &BTreeSet<T::MemberId>,
    ) -> DispatchResult {
        for member_id in whitelist {
            ensure!(
                T::MemberAuthenticator::controller_account_id(*member_id).is_ok(),
                Error::<T>::WhitelistedMemberDoesNotExist
            );
        }
        Ok(())
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
        starting_price: BalanceOf<T>,
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

    /// Ensure given participant has sufficient usable balance to cover the nft purchase
    pub(crate) fn ensure_sufficient_balance_to_pay_for_nft(
        participant_account_id: &T::AccountId,
        price: BalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            has_sufficient_balance_for_payment::<T>(participant_account_id, price),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Ensure given participant can buy nft now
    pub(crate) fn ensure_can_buy_now(
        nft: &Nft<T>,
        participant_account_id: &T::AccountId,
        witness_price: BalanceOf<T>,
    ) -> DispatchResult {
        if let TransactionalStatus::<T>::BuyNow(price) = &nft.transactional_status {
            ensure!(
                *price == witness_price,
                Error::<T>::InvalidBuyNowWitnessPriceProvided
            );
            Self::ensure_sufficient_balance_to_pay_for_nft(participant_account_id, *price)
        } else {
            Err(Error::<T>::NftNotInBuyNowState.into())
        }
    }

    /// Ensure new pending offer for given participant is available to proceed
    pub(crate) fn ensure_new_pending_offer_available_to_proceed(
        nft: &Nft<T>,
        participant_account_id: &T::AccountId,
        witness_price: Option<<T as balances::Config>::Balance>,
    ) -> DispatchResult {
        if let TransactionalStatus::<T>::InitiatedOfferToMember(member_id, price) =
            &nft.transactional_status
        {
            // Validate witness price
            ensure!(
                *price == witness_price,
                Error::<T>::InvalidNftOfferWitnessPriceProvided
            );

            // Authorize participant under given member id
            ensure_member_auth_success::<T>(participant_account_id, member_id)?;

            if let Some(price) = price {
                Self::ensure_sufficient_balance_to_pay_for_nft(participant_account_id, *price)?;
            }
            Ok(())
        } else {
            Err(Error::<T>::PendingOfferDoesNotExist.into())
        }
    }

    /// Buy nft
    pub(crate) fn buy_now(
        nft: Nft<T>,
        royalty_payment: Option<(Royalty, T::AccountId)>,
        old_owner_account_id: Option<T::AccountId>,
        new_owner_account_id: T::AccountId,
        new_owner: T::MemberId,
    ) -> Result<Nft<T>, DispatchError> {
        if let TransactionalStatus::<T>::BuyNow(price) = &nft.transactional_status {
            Self::complete_payment(
                royalty_payment,
                price.to_owned(),
                new_owner_account_id,
                old_owner_account_id,
            )?;
        }

        let updated_nft = nft
            .with_transactional_status(TransactionalStatus::<T>::Idle)
            .with_member_owner(new_owner);

        Ok(updated_nft)
    }

    /// Completes nft offer
    pub(crate) fn complete_nft_offer(
        mut nft: Nft<T>,
        royalty_payment: Option<(Royalty, T::AccountId)>,
        owner_account_id: Option<T::AccountId>,
        new_owner_account_id: T::AccountId,
    ) -> Result<Nft<T>, DispatchError> {
        if let TransactionalStatus::<T>::InitiatedOfferToMember(to, price) =
            &nft.transactional_status
        {
            if let Some(price) = price {
                Self::complete_payment(
                    royalty_payment,
                    *price,
                    new_owner_account_id,
                    owner_account_id,
                )?;
            }
            nft.owner = NftOwner::Member(*to);
        }

        let updated_nft = Nft::<T> {
            transactional_status: TransactionalStatus::<T>::Idle,
            ..nft
        };

        Ok(updated_nft)
    }

    /// Complete payment, either auction related or buy now/offer
    pub(crate) fn complete_payment(
        royalty_payment: Option<(Royalty, T::AccountId)>,
        amount: BalanceOf<T>,
        sender_account_id: T::AccountId,
        receiver_account_id: Option<T::AccountId>,
    ) -> DispatchResult {
        // burn sender full amount
        burn_from_usable::<T>(&sender_account_id, amount)?;

        // compute platform fee
        let platform_fee_pct = Self::platform_fee_percentage();
        let platform_fee = platform_fee_pct.mul_floor(amount);

        // established net amount and pay royalties if necessary
        let net_amount = if let Some((nominal_royalty_pct, creator_account)) = royalty_payment {
            // min(creator_royalty, 100% - platform_fee_percentage) is used to avoid underflow
            let effective_royalty_pct = min(
                nominal_royalty_pct,
                Perbill::one().saturating_sub(platform_fee_pct),
            );
            let royalty = effective_royalty_pct.mul_floor(amount);

            // deposit to creator account
            let _ = Balances::<T>::deposit_creating(&creator_account, royalty);

            amount.saturating_sub(platform_fee).saturating_sub(royalty)
        } else {
            amount.saturating_sub(platform_fee)
        };

        if let Some(ref nft_owner_account) = receiver_account_id {
            let _ = Balances::<T>::deposit_creating(nft_owner_account, net_amount);
        }

        Ok(())
    }

    pub(crate) fn complete_auction(
        nft: Nft<T>,
        video: &Video<T>,
        royalty_payment: Option<(Royalty, T::AccountId)>,
        winner_id: T::MemberId,
        amount: BalanceOf<T>,
    ) -> Result<Nft<T>, DispatchError> {
        let account_deposit_into = Self::ensure_nft_owner_has_beneficiary_account(video, &nft).ok();
        let account_withdraw_from = ContentTreasury::<T>::module_account_id();

        Self::complete_payment(
            royalty_payment,
            amount,
            account_withdraw_from,
            account_deposit_into,
        )?;

        let updated_nft = nft
            .with_transactional_status(TransactionalStatus::<T>::Idle)
            .with_member_owner(winner_id);

        Ok(updated_nft)
    }

    /// NFT owned by:
    /// - Member: member controller account is used
    /// - Channel: channel account
    /// In order to statically guarantee that `video.in_channel` exists, by leveraging the
    /// Runtime invariant: `video` exists => `video.in_channel` exists
    pub(crate) fn ensure_nft_owner_has_beneficiary_account(
        video: &Video<T>,
        nft: &Nft<T>,
    ) -> Result<T::AccountId, DispatchError> {
        match nft.owner {
            NftOwner::Member(member_id) => T::MemberAuthenticator::controller_account_id(member_id),
            NftOwner::ChannelOwner => {
                Ok(ContentTreasury::<T>::account_for_channel(video.in_channel))
            }
        }
    }

    pub(crate) fn ensure_nft_exists(video_id: T::VideoId) -> Result<Nft<T>, Error<T>> {
        Self::ensure_video_exists(&video_id).and_then(|video| video.ensure_nft_is_issued::<T>())
    }

    // NFT

    /// Get nft english auction record
    pub(crate) fn ensure_in_english_auction_state(
        nft: &Nft<T>,
    ) -> Result<EnglishAuction<T>, DispatchError> {
        if let TransactionalStatus::<T>::EnglishAuction(auction) = &nft.transactional_status {
            Ok(auction.to_owned())
        } else {
            Err(Error::<T>::IsNotEnglishAuctionType.into())
        }
    }

    /// Get nft open auction record
    pub(crate) fn ensure_in_open_auction_state(
        nft: &Nft<T>,
    ) -> Result<OpenAuction<T>, DispatchError> {
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
    pub(crate) fn ensure_in_pending_offer_state(nft: &Nft<T>) -> DispatchResult {
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
    pub(crate) fn ensure_in_buy_now_state(nft: &Nft<T>) -> DispatchResult {
        ensure!(
            matches!(
                nft.transactional_status,
                TransactionalStatus::<T>::BuyNow(..),
            ),
            Error::<T>::NftNotInBuyNowState
        );
        Ok(())
    }

    pub(crate) fn build_royalty_payment(
        video: &Video<T>,
        creator_royalty: Option<Royalty>,
    ) -> Option<(Royalty, T::AccountId)> {
        // payment is none if there is no royalty
        if let Some(royalty) = creator_royalty {
            let reward_account = ContentTreasury::<T>::account_for_channel(video.in_channel);
            Some((royalty, reward_account))
        } else {
            None
        }
    }
}
