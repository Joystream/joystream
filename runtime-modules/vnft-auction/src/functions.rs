use crate::*;

impl<T: Trait> Module<T> {
    /// Authorize auctioneer
    pub(crate) fn authorize_auctioneer(
        origin: T::Origin,
        actor: &ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
        auction_params: &AuctionParams<
            T::VNFTId,
            VideoId<T>,
            <T as timestamp::Trait>::Moment,
            BalanceOf<T>,
        >,
    ) -> Result<T::AccountId, DispatchError> {
        if let AuctionMode::WithoutIsuance(vnft_id) = auction_params.auction_mode {
            let vnft = Self::ensure_vnft_exists(vnft_id)?;

            // Only members are supposed to start auctions for already existing nfts
            if let ContentActor::Member(member_id) = actor {
                let account_id = Self::authorize_auction_participant(origin, *member_id)?;

                Self::ensure_vnft_ownership(&account_id, &vnft)?;

                Ok(account_id)
            } else {
                Err(Error::<T>::AuctionDoesNotExist.into())
            }
        } else {
            // TODO: Move to common pallet
            Self::authorize_content_actor(origin.clone(), actor)?;
            let account_id = ensure_signed(origin)?;
            Ok(account_id)
        }
    }

    /// Authorize auction participant under given member id
    pub(crate) fn authorize_auction_participant(
        origin: T::Origin,
        member_id: MemberId<T>,
    ) -> Result<T::AccountId, Error<T>> {
        T::MemberOriginValidator::ensure_actor_origin(origin, member_id)
            .map_err(|_| Error::<T>::ActorOriginAuthError)
    }

    /// Authorize content actor
    pub(crate) fn authorize_content_actor(
        origin: T::Origin,
        actor: &ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
    ) -> Result<(), Error<T>> {
        // TODO: Move to common pallet
        content::ensure_actor_authorized_to_create_channel::<T>(origin.clone(), actor)
            .map_err(|_| Error::<T>::ActorNotAuthorizedToIssueNft)
    }

    /// Ensure auction participant has sufficient balance to make bid
    pub(crate) fn ensure_has_sufficient_balance(
        participant: &T::AccountId,
        bid: BalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            T::NftCurrencyProvider::can_reserve(participant, bid),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Safety/bound checks for auction parameters
    pub(crate) fn validate_auction_params(
        auction_params: &AuctionParams<
            T::VNFTId,
            VideoId<T>,
            <T as timestamp::Trait>::Moment,
            BalanceOf<T>,
        >,
    ) -> DispatchResult {
        Self::ensure_vnft_does_not_exist(auction_params.video_id)?;
        if let AuctionMode::WithIssuance(Some(royalty), _) = auction_params.auction_mode {
            Self::ensure_royalty_bounds_satisfied(royalty)?;
        }

        Self::ensure_round_time_bounds_satisfied(auction_params.round_time)?;
        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;
        Self::ensure_bid_step_bounds_satisfied(auction_params.minimal_bid_step)?;

        Ok(())
    }

    /// Ensure given account id is vnft owner
    pub(crate) fn ensure_vnft_ownership(
        account_id: &T::AccountId,
        vnft: &VNFT<T::AccountId>,
    ) -> DispatchResult {
        ensure!(*account_id == vnft.owner, Error::<T>::DoesNotOwnVNFT);
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
    pub(crate) fn ensure_round_time_bounds_satisfied(round_time: T::Moment) -> DispatchResult {
        ensure!(
            round_time <= Self::max_round_time(),
            Error::<T>::RoundTimeUpperBoundExceeded
        );
        ensure!(
            round_time >= Self::min_round_time(),
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

    /// Check whether auction for given video id exists
    pub(crate) fn is_auction_exist(video_id: T::VideoId) -> bool {
        <AuctionByVideoId<T>>::contains_key(video_id)
    }

    // /// Check whether vnft for given vnft id exists
    // pub(crate) fn is_vnft_exist(vnft_id: T::VNFTId) -> bool {

    // }

    /// Ensure auction for given video id exists
    pub(crate) fn ensure_auction_exists(video_id: T::VideoId) -> Result<Auction<T>, Error<T>> {
        ensure!(
            Self::is_auction_exist(video_id),
            Error::<T>::AuctionDoesNotExist
        );
        Ok(Self::auction_by_video_id(video_id))
    }

    /// Ensure given vnft exists
    pub(crate) fn ensure_vnft_exists(vnft_id: T::VNFTId) -> Result<VNFT<T::AccountId>, Error<T>> {
        ensure!(
            <VNFTById<T>>::contains_key(vnft_id),
            Error::<T>::VNFTDoesNotExist
        );
        Ok(Self::vnft_by_vnft_id(vnft_id))
    }

    /// Ensure given video id vnft relation does not exist
    pub(crate) fn ensure_vnft_does_not_exist(video_id: T::VideoId) -> DispatchResult {
        ensure!(
            !<VNFTIdByVideo<T>>::contains_key(video_id),
            Error::<T>::VNFTAlreadyExists
        );
        Ok(())
    }

    /// Try complete auction when round time expired
    pub(crate) fn try_complete_auction(auction: &Auction<T>, video_id: T::VideoId) -> bool {
        let now = timestamp::Module::<T>::now();
        if (now - auction.last_bid_time) >= auction.round_time {
            Self::complete_auction(auction, video_id);
            true
        } else {
            false
        }
    }

    /// Complete auction
    pub(crate) fn complete_auction(auction: &Auction<T>, video_id: T::VideoId) {
        // Remove auction entry
        <AuctionByVideoId<T>>::remove(video_id);

        match auction.auction_mode.clone() {
            AuctionMode::WithIssuance(royalty, _) => {
                let last_bid = auction.last_bid;

                // Slash last bidder bid and deposit it into auctioneer account
                T::NftCurrencyProvider::slash_reserved(&auction.last_bidder, last_bid);
                T::NftCurrencyProvider::deposit_creating(&auction.auctioneer_account_id, last_bid);

                let creator_royalty = if let Some(royalty) = royalty {
                    Some((auction.auctioneer_account_id.clone(), royalty))
                } else {
                    None
                };

                <Module<T>>::issue_vnft(auction.last_bidder.clone(), video_id, creator_royalty)
            }
            AuctionMode::WithoutIsuance(vnft_id) => {
                <Module<T>>::complete_vnft_auction_transfer(auction, vnft_id)
            }
        }
        Self::deposit_event(RawEvent::AuctionCompleted(video_id, auction.to_owned()));
    }

    /// Issue vnft and update mapping relations
    pub(crate) fn issue_vnft(
        who: T::AccountId,
        video_id: T::VideoId,
        creator_royalty: Option<(T::AccountId, Royalty)>,
    ) {
        // Issue vnft
        let vnft_id = Self::next_video_nft_id();

        <VNFTIdByVideo<T>>::insert(video_id, vnft_id);

        <VNFTById<T>>::insert(vnft_id, VNFT::new(who, creator_royalty));

        NextVNFTId::<T>::put(vnft_id + T::VNFTId::one());

        Self::deposit_event(RawEvent::NftIssued(video_id, vnft_id));
    }

    /// Complete vnft transfer
    pub(crate) fn complete_vnft_auction_transfer(auction: &Auction<T>, vnft_id: T::VNFTId) {
        let vnft = Self::vnft_by_vnft_id(vnft_id);
        let last_bid = auction.last_bid;

        if let Some((creator_account_id, creator_royalty)) = vnft.creator_royalty {
            let royalty = creator_royalty * last_bid;

            // Slash last bidder bid
            T::NftCurrencyProvider::slash_reserved(&auction.last_bidder, last_bid);

            // Deposit bid, exluding royalty amount into auctioneer account
            T::NftCurrencyProvider::deposit_creating(
                &auction.auctioneer_account_id,
                last_bid - royalty,
            );

            // Deposit royalty into creator account
            T::NftCurrencyProvider::deposit_creating(&creator_account_id, royalty);
        } else {
            // Slash last bidder bid and deposit it into auctioneer account
            T::NftCurrencyProvider::slash_reserved(&auction.last_bidder, last_bid);

            T::NftCurrencyProvider::deposit_creating(&auction.auctioneer_account_id, last_bid);
        }

        <VNFTById<T>>::mutate(vnft_id, |vnft| vnft.owner = auction.last_bidder.clone());
    }
}
