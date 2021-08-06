mod types;
pub use types::*;

use crate::*;

impl<T: Trait> Module<T> {
    /// Authorize auctioneer
    pub(crate) fn authorize_auctioneer(
        origin: T::Origin,
        actor: &ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
        auction_params: &AuctionParams<
            T::VideoId,
            <T as pallet_timestamp::Trait>::Moment,
            BalanceOf<T>,
        >,
        video: &Video<T>,
    ) -> Result<T::AccountId, DispatchError> {
        let account_id = ensure_signed(origin.clone())?;

        if let AuctionMode::WithoutIsuance = auction_params.auction_mode {
            // Only members are supposed to start auctions for already existing nfts
            if let ContentActor::Member(member_id) = actor {
                ensure_member_auth_success::<T>(member_id, &account_id)?;

                video.ensure_vnft_ownership::<T>(&account_id)?;
            } else {
                return Err(Error::<T>::ActorNotAuthorizedToManageAuction.into());
            }
        } else {
            // TODO: Move to common pallet
            Self::authorize_content_actor(origin, actor)?;
        }
        Ok(account_id)
    }

    /// Authorize content actor
    pub(crate) fn authorize_content_actor(
        origin: T::Origin,
        actor: &ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
    ) -> Result<(), Error<T>> {
        // TODO: Move to common pallet
        ensure_actor_authorized_to_create_channel::<T>(origin, actor)
            .map_err(|_| Error::<T>::ActorNotAuthorizedToManageAuction)?;
        Ok(())
    }

    /// Ensure auction participant has sufficient balance to make bid
    pub(crate) fn ensure_has_sufficient_balance(
        participant: &T::AccountId,
        bid: BalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            T::Currency::can_reserve(participant, bid),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Safety/bound checks for auction parameters
    pub(crate) fn validate_auction_params(
        auction_params: &AuctionParams<
            T::VideoId,
            <T as pallet_timestamp::Trait>::Moment,
            BalanceOf<T>,
        >,
        video: &Video<T>,
    ) -> DispatchResult {
        match auction_params.auction_mode {
            AuctionMode::WithIssuance(Some(royalty), _) => {
                video.ensure_vnft_not_issued::<T>()?;
                Self::ensure_reward_account_is_set(video.in_channel)?;
                Self::ensure_royalty_bounds_satisfied(royalty)?;
            }
            AuctionMode::WithoutIsuance => {
                video.ensure_nft_transactional_status_is_idle::<T>()?;
            }
            _ => (),
        }

        Self::ensure_auction_duration_bounds_satisfied(auction_params.auction_duration)?;
        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;
        Self::ensure_bid_step_bounds_satisfied(auction_params.minimal_bid_step)?;

        Ok(())
    }

    /// Ensure channel reward_account account is set
    pub(crate) fn ensure_reward_account_is_set(channel_id: T::ChannelId) -> DispatchResult {
        Self::channel_by_id(channel_id)
            .reward_account
            .ok_or(Error::<T>::RewardAccountIsNotSet)?;
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

    /// Ensure royalty bounds satisfied
    pub(crate) fn ensure_auction_duration_bounds_satisfied(
        auction_duration: T::Moment,
    ) -> DispatchResult {
        ensure!(
            auction_duration <= Self::max_auction_duration(),
            Error::<T>::RoundTimeUpperBoundExceeded
        );
        ensure!(
            auction_duration >= Self::min_auction_duration(),
            Error::<T>::RoundTimeLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure royalty bounds satisfied
    pub(crate) fn ensure_starting_price_bounds_satisfied(
        starting_price: BalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            starting_price >= Self::max_starting_price(),
            Error::<T>::StartingPriceUpperBoundExceeded
        );
        ensure!(
            starting_price <= Self::min_starting_price(),
            Error::<T>::StartingPriceLowerBoundExceeded
        );
        Ok(())
    }

    /// Issue vnft
    pub(crate) fn issue_vnft(
        video: &mut Video<T>,
        video_id: T::VideoId,
        owner: T::AccountId,
        creator_royalty: Option<Royalty>,
        metadata: Metadata,
    ) {
        video.nft_status = NFTStatus::Owned(OwnedNFT {
            owner,
            transactional_status: TransactionalStatus::Idle,
            creator_royalty,
        });

        Self::deposit_event(RawEvent::NftIssued(
            video_id,
            video.nft_status.clone(),
            metadata,
        ));
    }

    /// Complete vnft transfer
    pub(crate) fn complete_vnft_auction_transfer(video: &mut Video<T>, auction_fee: BalanceOf<T>) {
        if let NFTStatus::Owned(OwnedNFT {
            owner,
            transactional_status: TransactionalStatus::Auction(auction),
            creator_royalty,
        }) = &video.nft_status
        {
            if let Some(last_bid) = &auction.last_bid {
                let last_bid_amount = last_bid.amount;
                if let Some(creator_royalty) = creator_royalty {
                    let royalty = *creator_royalty * last_bid_amount;

                    // Slash last bidder bid
                    T::Currency::slash_reserved(&last_bid.bidder, last_bid_amount);

                    // Deposit bid, exluding royalty amount and auction fee into auctioneer account

                    if last_bid_amount > royalty + auction_fee {
                        T::Currency::deposit_creating(
                            &owner,
                            last_bid_amount - royalty - auction_fee,
                        );
                    } else {
                        T::Currency::deposit_creating(&owner, last_bid_amount - auction_fee);
                    }

                    // Should always be Some(_) at this stage, because of previously made check.
                    if let Some(creator_account_id) =
                        Self::channel_by_id(video.in_channel).reward_account
                    {
                        // Deposit royalty into creator account
                        T::Currency::deposit_creating(&creator_account_id, royalty);
                    }
                } else {
                    // Slash last bidder bid and deposit it into auctioneer account
                    T::Currency::slash_reserved(&last_bid.bidder, last_bid_amount);

                    // Deposit bid, exluding auction fee into auctioneer account
                    T::Currency::deposit_creating(&owner, last_bid_amount - auction_fee);
                }

                video.nft_status = NFTStatus::Owned(OwnedNFT {
                    owner: last_bid.bidder.clone(),
                    transactional_status: TransactionalStatus::Idle,
                    creator_royalty: creator_royalty.clone(),
                });
            }
        }
    }

    /// Complete auction
    pub(crate) fn complete_auction(mut video: Video<T>, video_id: T::VideoId) -> Video<T> {
        if let NFTStatus::Owned(OwnedNFT {
            owner,
            transactional_status: TransactionalStatus::Auction(auction),
            ..
        }) = &video.nft_status
        {
            let auction = auction.to_owned();
            if let Some(last_bid) = auction.last_bid {
                let bid = last_bid.amount;
                let auction_fee = Self::auction_fee_percentage() * bid;

                match &auction.auction_mode {
                    AuctionMode::WithIssuance(royalty, metadata) => {
                        // Slash last bidder bid
                        T::Currency::slash_reserved(&last_bid.bidder, bid);
                        // Deposit last bidder bid minus auction fee into auctioneer account
                        T::Currency::deposit_creating(&owner, bid - auction_fee);

                        let creator_royalty = if let Some(royalty) = royalty {
                            Some(royalty.to_owned())
                        } else {
                            None
                        };

                        // Issue vnft
                        Self::issue_vnft(
                            &mut video,
                            video_id,
                            last_bid.bidder.clone(),
                            creator_royalty,
                            metadata,
                        );
                    }
                    AuctionMode::WithoutIsuance => {
                        Self::complete_vnft_auction_transfer(&mut video, auction_fee);
                    }
                }
            }
        }
        video
    }
}
