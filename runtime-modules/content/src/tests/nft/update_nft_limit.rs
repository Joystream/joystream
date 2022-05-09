#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_system::RawOrigin;

#[test]
fn update_nft_limits_works_as_expected_for_global_daily_limit() {
    with_default_mock_builder(|| {
        let lead = RawOrigin::Signed(LEAD_ACCOUNT_ID);
        let root = RawOrigin::Root;
        let member = RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID);
        let nft_limit_id = NftLimitId::GlobalDaily;

        update_nft_limit_test_helper(root.clone(), nft_limit_id, Ok(()));
        update_nft_limit_test_helper(lead.clone(), nft_limit_id, Err(DispatchError::BadOrigin));
        update_nft_limit_test_helper(member.clone(), nft_limit_id, Err(DispatchError::BadOrigin));
    })
}

#[test]
fn update_nft_limits_works_as_expected_for_global_weekly_limit() {
    with_default_mock_builder(|| {
        let lead = RawOrigin::Signed(LEAD_ACCOUNT_ID);
        let root = RawOrigin::Root;
        let member = RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID);
        let nft_limit_id = NftLimitId::GlobalWeekly;

        update_nft_limit_test_helper(root.clone(), nft_limit_id, Ok(()));
        update_nft_limit_test_helper(lead.clone(), nft_limit_id, Err(DispatchError::BadOrigin));
        update_nft_limit_test_helper(member.clone(), nft_limit_id, Err(DispatchError::BadOrigin));
    })
}

#[test]
fn update_nft_limits_works_as_expected_for_channel_daily_limit() {
    with_default_mock_builder(|| {
        let lead = RawOrigin::Signed(LEAD_ACCOUNT_ID);
        let root = RawOrigin::Root;
        let member = RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID);
        let channel_id = 1;
        let nft_limit_id = NftLimitId::ChannelDaily(channel_id);

        update_nft_limit_test_helper(root.clone(), nft_limit_id, Err(DispatchError::BadOrigin));
        update_nft_limit_test_helper(lead.clone(), nft_limit_id, Ok(()));
        update_nft_limit_test_helper(
            member.clone(),
            nft_limit_id,
            Err(Error::<Test>::LeadAuthFailed.into()),
        );
    })
}

#[test]
fn update_nft_limits_works_as_expected_for_channel_weekly_limit() {
    with_default_mock_builder(|| {
        let lead = RawOrigin::Signed(LEAD_ACCOUNT_ID);
        let root = RawOrigin::Root;
        let member = RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID);
        let channel_id = 1;
        let nft_limit_id = NftLimitId::ChannelWeekly(channel_id);

        update_nft_limit_test_helper(root.clone(), nft_limit_id, Err(DispatchError::BadOrigin));
        update_nft_limit_test_helper(lead.clone(), nft_limit_id, Ok(()));
        update_nft_limit_test_helper(
            member.clone(),
            nft_limit_id,
            Err(Error::<Test>::LeadAuthFailed.into()),
        );
    })
}

fn update_nft_limit_test_helper(
    origin: RawOrigin<AccountId>,
    nft_limit_id: NftLimitId<u64>,
    expected_result: DispatchResult,
) {
    // Run to block one to see emitted events
    run_to_block(1);

    let new_limit = LimitPerPeriod {
        block_number_period: 1111,
        limit: 7777,
    };

    UpdateNftLimitFixture::new()
        .with_origin(origin)
        .with_nft_limit_id(nft_limit_id)
        .with_limit(new_limit)
        .call_and_assert(expected_result);
}

// channel creation tests
#[test]
fn default_channel_nft_limits_set_successfully() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);
        set_dynamic_bag_creation_policy_for_storage_numbers(0);
        create_initial_storage_buckets_helper();

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));

        let channel_id = 1;
        let channel = Content::channel_by_id(channel_id);
        assert_eq!(channel.daily_nft_limit, DefaultChannelDailyNftLimit::get());
        assert_eq!(
            channel.weekly_nft_limit,
            DefaultChannelWeeklyNftLimit::get()
        );
    })
}
