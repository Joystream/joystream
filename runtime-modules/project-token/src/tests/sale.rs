#![cfg(test)]

use crate::balance;
use crate::errors::Error;
use crate::joy;
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::types::Joy;
use crate::types::MerkleProofOf;
use crate::{member, merkle_proof, merkle_root};
use frame_support::assert_ok;
use sp_arithmetic::Permill;
use sp_runtime::DispatchError;

/////////////////////////////////////////////////////////
////////////////// SALE INITIALIZATION //////////////////
/////////////////////////////////////////////////////////

#[test]
fn unsuccesful_token_sale_init_with_invalid_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        InitTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_start_block_in_the_past() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(0)
            .call_and_assert(Err(Error::<Test>::SaleStartingBlockInThePast.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_zero_duration() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_duration(0)
            .call_and_assert(Err(Error::<Test>::SaleDurationIsZero.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_zero_upper_bound_quantity() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_upper_bound_quantity(0)
            .call_and_assert(Err(Error::<Test>::SaleUpperBoundQuantityIsZero.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_zero_unit_price() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_unit_price(balance!(0))
            .call_and_assert(Err(Error::<Test>::SaleUnitPriceIsZero.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_zero_cap_per_member() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_cap_per_member(balance!(0))
            .call_and_assert(Err(Error::<Test>::SaleCapPerMemberIsZero.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_duration_too_short() {
    let min_sale_duration: BlockNumber = 10u64;
    let config = GenesisConfigBuilder::new_empty()
        .with_min_sale_duration(min_sale_duration)
        .build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_duration(min_sale_duration - 1)
            .call_and_assert(Err(Error::<Test>::SaleDurationTooShort.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_upper_bound_quantity_exceeding_source_balance() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_upper_bound_quantity(DEFAULT_INITIAL_ISSUANCE + 1)
            .call_and_assert(Err(Error::<Test>::InsufficientTransferrableBalance.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_with_invalid_source() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_member_id(member!(2).1)
            .call_and_assert(Err(Error::<Test>::AccountInformationDoesNotExist.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_when_token_not_idle() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenIssuanceNotInIdleState.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_when_remaining_unrecovered_toknes_from_previous_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        InitTokenSaleFixture::default().call_and_assert(Err(
            Error::<Test>::RemainingUnrecoveredTokensFromPreviousSale.into(),
        ));
    })
}

#[test]
fn succesful_token_sale_init() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));

        InitTokenSaleFixture::default().call_and_assert(Ok(()));

        // Assert Idle state after sale ends
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

#[test]
fn succesful_token_sale_init_with_custom_start_block() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));

        InitTokenSaleFixture::default()
            .with_start_block(100)
            .call_and_assert(Ok(()));

        // Assert sale begins at block 100
        increase_block_number_by(99);
        let sale = TokenSale::try_from_params::<Test>(
            TokenSaleParams {
                starts_at: Some(100),
                ..default_token_sale_params()
            },
            member!(1).0,
            Some(member!(1).1),
            0,
        )
        .unwrap();
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Sale(sale));
        // Assert Idle state at block block 100 + DEFAULT_SALE_DURATION
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

/////////////////////////////////////////////////////////
///////////////// UPCOMING SALE UPDATE //////////////////
/////////////////////////////////////////////////////////

#[test]
fn unsuccesful_upcoming_sale_update_with_invalid_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        UpdateUpcomingSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()))
    })
}

#[test]
fn unsuccesful_upcoming_sale_update_when_token_is_idle() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoUpcomingSale.into()))
    })
}

#[test]
fn unsuccesful_upcoming_sale_update_when_sale_is_ongoing() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoUpcomingSale.into()))
    })
}

#[test]
fn unsuccesful_upcoming_sale_update_with_start_block_in_the_past() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(100)
            .call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .with_new_start_block(Some(0))
            .call_and_assert(Err(Error::<Test>::SaleStartingBlockInThePast.into()));
    })
}

#[test]
fn successful_upcoming_sale_update() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(100)
            .call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .with_new_start_block(Some(20))
            .with_new_duration(Some(50))
            .call_and_assert(Ok(()));

        let token = Token::token_info_by_id(1);
        assert!(matches!(
            IssuanceState::of::<Test>(&token),
            IssuanceState::UpcomingSale { .. }
        ));

        increase_block_number_by(19);
        let token = Token::token_info_by_id(1);
        assert!(matches!(
            IssuanceState::of::<Test>(&token),
            IssuanceState::Sale { .. }
        ));

        increase_block_number_by(50);
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

/////////////////////////////////////////////////////////
//////////////////// SALE PURCHASES /////////////////////
/////////////////////////////////////////////////////////

#[test]
fn unsuccesful_sale_purchase_non_existing_token() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_when_no_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoActiveSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_when_sale_not_started_yet() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(10)
            .call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoActiveSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_after_sale_finished() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoActiveSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_insufficient_joy_balance_new_account() {
    let bloat_bond = joy!(100);
    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(
            &member!(1).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + bloat_bond,
        );
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT
                + bloat_bond
                - 1,
        );
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::InsufficientJoyBalance.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_insufficient_joy_balance_existing_account() {
    let bloat_bond = joy!(100);
    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(
            &member!(1).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT
                - 1,
        );
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default()
            .with_member_id(member!(1).0)
            .with_sender(member!(1).1)
            .call_and_assert(Err(Error::<Test>::InsufficientJoyBalance.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_amount_exceeds_quantity_left() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * (DEFAULT_INITIAL_ISSUANCE + 1),
        );
        PurchaseTokensOnSaleFixture::default()
            .with_amount(DEFAULT_INITIAL_ISSUANCE + 1)
            .call_and_assert(Err(Error::<Test>::NotEnoughTokensOnSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_amount_is_zero() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default()
            .with_amount(0)
            .call_and_assert(Err(Error::<Test>::SalePurchaseAmountIsZero.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_vesting_balances_limit_reached() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        let max_vesting_schedules =
            <Test as crate::Trait>::MaxVestingBalancesPerAccountPerToken::get();
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_PURCHASE_AMOUNT
                    .saturating_mul(DEFAULT_SALE_UNIT_PRICE)
                    .saturating_mul((max_vesting_schedules + 1).into()),
        );
        for _ in 0..<Test as crate::Trait>::MaxVestingBalancesPerAccountPerToken::get() {
            InitTokenSaleFixture::default()
                .with_upper_bound_quantity(DEFAULT_SALE_PURCHASE_AMOUNT)
                .with_vesting_schedule_params(Some(VestingScheduleParams {
                    blocks_before_cliff: DEFAULT_SALE_DURATION * (max_vesting_schedules + 1) as u64,
                    linear_vesting_duration: 100,
                    cliff_amount_percentage: Permill::from_percent(0),
                }))
                .call_and_assert(Ok(()));
            PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
            increase_block_number_by(DEFAULT_SALE_DURATION);
        }
        InitTokenSaleFixture::default()
            .with_upper_bound_quantity(DEFAULT_SALE_PURCHASE_AMOUNT)
            .call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default().call_and_assert(Err(
            Error::<Test>::MaxVestingSchedulesPerAccountPerTokenReached.into(),
        ));
    })
}

#[test]
fn unsuccesful_sale_purchase_with_cap_exceeded_with_vesting() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_cap_per_member(DEFAULT_SALE_PURCHASE_AMOUNT)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * (DEFAULT_SALE_PURCHASE_AMOUNT + 1),
        );
        // Make succesful purchase
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        // Try making another one (that would exceed the cap)
        PurchaseTokensOnSaleFixture::default()
            .with_amount(1)
            .call_and_assert(Err(Error::<Test>::SalePurchaseCapExceeded.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_with_cap_exceeded_no_vesting() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_cap_per_member(DEFAULT_SALE_PURCHASE_AMOUNT)
            .with_vesting_schedule_params(None)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * (DEFAULT_SALE_PURCHASE_AMOUNT + 1),
        );
        // Make succesful purchase
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        // Try making another one (that would exceed the cap)
        PurchaseTokensOnSaleFixture::default()
            .with_amount(1)
            .call_and_assert(Err(Error::<Test>::SalePurchaseCapExceeded.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_with_permissioned_token_and_non_existing_account() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let commitment = merkle_root![member!(1).0, member!(2).0];
        IssueTokenFixture::default()
            .with_transfer_policy(TransferPolicyParams::Permissioned(WhitelistParams {
                commitment,
                payload: None,
            }))
            .call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::AccountInformationDoesNotExist.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_with_invalid_member_controller() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + (DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT),
        );
        PurchaseTokensOnSaleFixture::default()
            .with_sender(member!(1).1)
            .call_and_assert(Err(DispatchError::Other(
                "origin signer not a member controller account",
            )));
    })
}

#[test]
fn succesful_sale_purchases_non_existing_account_no_vesting_schedule() {
    let bloat_bond = joy!(100);
    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(
            &member!(1).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + bloat_bond,
        );
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_vesting_schedule_params(None)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + (DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT * 2)
                + bloat_bond,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));

        let buyer_acc_info = Token::account_info_by_token_and_member(1, member!(2).0);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            DEFAULT_SALE_PURCHASE_AMOUNT * 2
        );
    })
}

#[test]
fn succesful_sale_purchases_non_existing_account_vesting_schedule() {
    let bloat_bond = joy!(100);
    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(
            &member!(1).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + bloat_bond,
        );
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_vesting_schedule_params(Some(VestingScheduleParams {
                blocks_before_cliff: 100,
                linear_vesting_duration: 200,
                cliff_amount_percentage: Permill::from_percent(30),
            }))
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + (DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT * 2)
                + bloat_bond,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));

        // At sale end block expect 0 tokens in available balance (due to 100 blocks remaining until cliff)
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let buyer_acc_info = Token::account_info_by_token_and_member(1, member!(2).0);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            0
        );

        // After cliff expect 30% of tokens in available balance (cliff_amount_percentage)
        increase_block_number_by(100);
        let buyer_acc_info = Token::account_info_by_token_and_member(1, member!(2).0);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            Permill::from_percent(30) * DEFAULT_SALE_PURCHASE_AMOUNT * 2
        );

        // After 50% of duration (100 blocks), expect 30% + (50% * 70%) = 65% of tokens in available balance
        increase_block_number_by(100);
        let buyer_acc_info = Token::account_info_by_token_and_member(1, member!(2).0);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            Permill::from_percent(65) * DEFAULT_SALE_PURCHASE_AMOUNT * 2
        );

        // At the end of vesting expect 100% of tokens in available balance
        increase_block_number_by(100);
        let buyer_acc_info = Token::account_info_by_token_and_member(1, member!(2).0);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            DEFAULT_SALE_PURCHASE_AMOUNT * 2
        );
    })
}

#[test]
fn succesful_sale_purchase_existing_account_permissioned_token() {
    let bloat_bond = joy!(100);
    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        let commitment = merkle_root![member!(1).0, member!(2).0];
        let proof = merkle_proof!(1, [member!(1).0, member!(2).0]);
        increase_account_balance(
            &member!(1).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + bloat_bond,
        );
        IssueTokenFixture::default()
            .with_transfer_policy(TransferPolicyParams::Permissioned(WhitelistParams {
                commitment,
                payload: None,
            }))
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + bloat_bond,
        );
        assert_ok!(Token::join_whitelist(
            Origin::signed(member!(2).1),
            member!(2).0,
            Token::next_token_id() - 1,
            proof
        ));
        assert_eq!(
            Joy::<Test>::usable_balance(&member!(2).1),
            <Test as crate::Trait>::JoyExistentialDeposit::get()
        );
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn succesful_sale_purchases_equal_to_member_cap_on_subsequent_sales() {
    let bloat_bond = joy!(100);
    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(
            &member!(1).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + bloat_bond,
        );
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT * 2
                + bloat_bond,
        );
        IssueTokenFixture::default().call_and_assert(Ok(()));
        for _ in 0..2 {
            InitTokenSaleFixture::default()
                .with_vesting_schedule_params(None)
                .with_cap_per_member(DEFAULT_SALE_PURCHASE_AMOUNT)
                .with_upper_bound_quantity(DEFAULT_SALE_PURCHASE_AMOUNT)
                .call_and_assert(Ok(()));
            PurchaseTokensOnSaleFixture::default()
                .with_amount(DEFAULT_SALE_PURCHASE_AMOUNT)
                .call_and_assert(Ok(()));
        }
        let buyer_acc_info = Token::account_info_by_token_and_member(1, member!(2).0);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            DEFAULT_SALE_PURCHASE_AMOUNT * 2
        );
    })
}

#[test]
fn succesful_sale_purchases_with_platform_fee() {
    let sale_platform_fee = Permill::from_percent(30);
    let config = GenesisConfigBuilder::new_empty()
        .with_sale_platform_fee(sale_platform_fee)
        .build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_unit_price(1)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + 100,
        );
        PurchaseTokensOnSaleFixture::default()
            .with_amount(99)
            .call_and_assert(Ok(()));
        // 99 tokens bought for 1 JOY each - expect `99 - floor(99 * 30%) = 99 - 29 = 70` JOY transferred
        assert_eq!(Joy::<Test>::usable_balance(member!(1).1), 70);
        PurchaseTokensOnSaleFixture::default()
            .with_amount(1)
            .call_and_assert(Ok(()));
        // 1 token bought for 1 JOY - expect `1 - floor(1 * 30%) = 1 - 0 = 1` JOY transferred
        assert_eq!(Joy::<Test>::usable_balance(member!(1).1), 71);
        // expect "empty" buyer JOY balance
        assert_eq!(
            Joy::<Test>::usable_balance(member!(2).1),
            <Test as crate::Trait>::JoyExistentialDeposit::get()
        )
    })
}

#[test]
fn succesful_sale_purchases_with_no_sale_earnings_destination_provided() {
    let sale_platform_fee = Permill::from_percent(30);
    let config = GenesisConfigBuilder::new_empty()
        .with_sale_platform_fee(sale_platform_fee)
        .build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_unit_price(1)
            .with_earnings_destination(None)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get() + 100,
        );

        let joy_supply_pre = Joy::<Test>::total_issuance();
        PurchaseTokensOnSaleFixture::default()
            .with_amount(100)
            .call_and_assert(Ok(()));

        // expect "empty" buyer JOY balance
        assert_eq!(
            Joy::<Test>::usable_balance(member!(2).1),
            <Test as crate::Trait>::JoyExistentialDeposit::get()
        );

        // expect JOY supply decreased by 100
        assert_eq!(
            Joy::<Test>::total_issuance(),
            joy_supply_pre.saturating_sub(100)
        );
    })
}

/////////////////////////////////////////////////////////
//////////////// RECOVER UNSOLD TOKENS ////////////////
/////////////////////////////////////////////////////////
#[test]
fn unsuccesful_recover_unsold_tokens_non_existing_token() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()));
    })
}

#[test]
fn unsuccesful_recover_unsold_tokens_no_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::NoTokensToRecover.into()));
    })
}

#[test]
fn unsuccesful_recover_unsold_tokens_during_active_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenIssuanceNotInIdleState.into()));
    })
}

#[test]
fn unsuccesful_recover_unsold_tokens_when_no_tokens_left() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_upper_bound_quantity(DEFAULT_SALE_PURCHASE_AMOUNT)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::NoTokensToRecover.into()));
    })
}

#[test]
fn succesful_recover_unsold_tokens() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &member!(2).1,
            <Test as crate::Trait>::JoyExistentialDeposit::get()
                + DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        RecoverUnsoldTokensFixture::default().call_and_assert(Ok(()));
    })
}
