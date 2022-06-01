#![cfg(test)]

use crate::tests::curators;
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;

#[test]
fn unsuccessful_claim_creator_token_patronage_credit_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        ClaimCreatorTokenPatronageCreditFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_claim_creator_token_patronage_credit_token_not_issued() {
    with_default_mock_builder(|| {
        run_to_block(1);

        CreateChannelFixture::default().call_and_assert(Ok(()));
        ClaimCreatorTokenPatronageCreditFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

#[test]
fn unsuccessful_claim_creator_token_patronage_credit_member_channel_unauthorized_actors() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        for (sender, actor, err) in get_default_member_channel_invalid_owner_contexts() {
            ClaimCreatorTokenPatronageCreditFixture::default()
                .with_sender(sender)
                .with_actor(actor)
                .call_and_assert(Err(err.into()))
        }
    })
}

#[test]
fn unsuccessful_claim_creator_token_patronage_credit_curator_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        ClaimCreatorTokenPatronageCreditFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::PatronageCanOnlyBeClaimedForMemberOwnedChannels.into(),
            ));
    })
}

#[test]
fn successful_claim_creator_token_patronage_credit_member_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        ClaimCreatorTokenPatronageCreditFixture::default().call_and_assert(Ok(()));
    })
}
