#![cfg(test)]

use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::types::{AmmCurve, AmmOperation, VestingScheduleParamsOf};
use crate::{joy, last_event_eq, member, token, Error, RawEvent, RepayableBloatBondOf};
use frame_support::{assert_err, assert_ok};
use sp_runtime::{traits::Zero, DispatchError, Permill};

// --------------------- amm_buy -------------------------------

#[test]
fn amm_buy_noop_ok_with_zero_requested_amount() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();
        let state_pre = sp_io::storage::root(sp_storage::StateVersion::V1);

        let result = AmmBuyFixture::default()
            .with_amount(0u32.into())
            .execute_call();

        let state_post = sp_io::storage::root(sp_storage::StateVersion::V1);
        assert_ok!(result);
        assert_eq!(state_pre, state_post);
    })
}

#[test]
fn amm_buy_fails_with_invalid_token_specified() {
    let config = GenesisConfigBuilder::new_empty().build();
    let token_id = token!(2);
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        let result = AmmBuyFixture::default()
            .with_token_id(token_id)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn amm_buy_fails_with_member_and_origin_auth() {
    let config = GenesisConfigBuilder::new_empty().build();
    let (_, sender) = member!(3);
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        let result = AmmBuyFixture::default().with_sender(sender).execute_call();

        assert_err!(
            result,
            DispatchError::Other("origin signer not a member controller account")
        );
    })
}

#[test]
fn amm_buy_succeeds_with_new_user() {
    let token_id = token!(1);
    let ((user_member_id, user_account_id), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            let account_number_pre = Token::token_info_by_id(token_id).accounts_number;

            AmmBuyFixture::default()
                .with_sender(user_account_id)
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .with_member_id(user_member_id)
                .execute_call()
                .unwrap();

            let account_number_post = Token::token_info_by_id(token_id).accounts_number;
            let account_data =
                Token::ensure_account_data_exists(token_id, &user_member_id).unwrap();
            assert_eq!(account_number_post - account_number_pre, 1);
            assert_eq!(account_data.amount, DEFAULT_AMM_BUY_AMOUNT);
            assert_eq!(
                account_data.bloat_bond,
                RepayableBloatBondOf::<Test>::new(Token::bloat_bond(), None)
            );
        })
}

#[test]
fn amm_buy_fails_with_token_not_in_amm_state() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = AmmBuyFixture::default().execute_call();

        assert_err!(result, Error::<Test>::NotInAmmState);
    })
}

#[test]
fn amm_buy_succeeds_with_existing_user() {
    let token_id = token!(1);
    let ((user_member_id, user_account_id), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            InitTokenSaleFixture::default().execute_call().unwrap();
            PurchaseTokensOnSaleFixture::default()
                .with_sender(user_account_id)
                .with_member_id(user_member_id)
                .call_and_assert(Ok(()));
            increase_block_number_by(DEFAULT_SALE_DURATION);
            FinalizeTokenSaleFixture::default().call_and_assert(Ok(()));
            ActivateAmmFixture::default().execute_call().unwrap();
            let user_amount_pre = Token::ensure_account_data_exists(token_id, &user_member_id)
                .unwrap()
                .amount;

            AmmBuyFixture::default()
                .with_sender(user_account_id)
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .with_member_id(user_member_id)
                .execute_call()
                .unwrap();

            let user_amount_post = Token::ensure_account_data_exists(token_id, &user_member_id)
                .unwrap()
                .amount;
            assert_eq!(user_amount_post - user_amount_pre, DEFAULT_AMM_BUY_AMOUNT);
        })
}

#[test]
fn amm_buy_failed_with_slippage_constraint_violated() {
    let slippage_tolerance = (Permill::zero(), Balance::zero());
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();

            let result = AmmBuyFixture::default()
                .with_slippage_tolerance(slippage_tolerance)
                .execute_call();

            assert_err!(result, Error::<Test>::SlippageToleranceExceeded);
        })
}

#[test]
fn amm_buy_fails_with_pricing_function_overflow() {
    let amount = Balance::max_value();
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();

            let result = AmmBuyFixture::default().with_amount(amount).execute_call();

            assert_err!(result, Error::<Test>::ArithmeticError);
        })
}

#[test]
fn amm_buy_ok_with_creator_token_issuance_increased() {
    let token_id = token!(1);
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            let supply_pre = Token::token_info_by_id(token_id).total_supply;

            AmmBuyFixture::default()
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .execute_call()
                .unwrap();

            let supply_post = Token::token_info_by_id(token_id).total_supply;
            assert_eq!(supply_post, supply_pre + DEFAULT_AMM_BUY_AMOUNT);
        })
}

#[test]
fn amm_treasury_balance_correctly_increased_during_amm_buy() {
    let token_id = token!(1);
    let ((user_member_id, user_account_id), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            let amm_reserve_account = Token::amm_treasury_account(token_id);
            let amm_reserve_pre = Balances::usable_balance(amm_reserve_account);
            let correctly_computed_joy_amount =
                amm_function_values(DEFAULT_AMM_BUY_AMOUNT, token_id, AmmOperation::Buy);

            AmmBuyFixture::default()
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .with_sender(user_account_id)
                .with_member_id(user_member_id)
                .execute_call()
                .unwrap();

            let amm_reserve_post = Balances::usable_balance(amm_reserve_account);
            assert_eq!(
                amm_reserve_post - amm_reserve_pre,
                correctly_computed_joy_amount
            );
        })
}

#[test]
fn amm_buy_fails_with_user_not_having_sufficient_usable_joy_required() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        let result = AmmBuyFixture::default().execute_call();

        assert_err!(result, Error::<Test>::InsufficientJoyBalance);
    })
}

#[test]
fn user_joy_balance_correctly_decreased_during_amm_buy() {
    let token_id = token!(1);
    let (_, user_account) = member!(2);
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            let correctly_computed_joy_amount =
                amm_function_values(DEFAULT_AMM_BUY_AMOUNT, token_id, AmmOperation::Buy);
            let user_reserve_pre = Balances::usable_balance(user_account);

            AmmBuyFixture::default()
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .execute_call()
                .unwrap();

            let user_reserve_post = Balances::usable_balance(user_account);
            assert_eq!(
                user_reserve_pre - user_reserve_post,
                correctly_computed_joy_amount
            );
        })
}

#[test]
fn amm_buy_ok_with_event_deposit() {
    let token_id = token!(1);
    let ((user_member_id, user_account_id), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            let price = amm_function_values(DEFAULT_AMM_BUY_AMOUNT, token_id, AmmOperation::Buy);

            AmmBuyFixture::default()
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .execute_call()
                .unwrap();

            last_event_eq!(RawEvent::TokensBoughtOnAmm(
                token_id,
                user_member_id,
                DEFAULT_AMM_BUY_AMOUNT,
                price,
            ));
        })
}

// --------------- ACTIVATION ----------------------------------

#[test]
fn amm_activation_fails_with_invalid_token_id() {
    let token_id = token!(2);
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        let result = ActivateAmmFixture::default()
            .with_token_id(token_id)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn activation_fails_when_status_is_not_idle() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        InitTokenSaleFixture::default().call_and_assert(Ok(()));

        let result = ActivateAmmFixture::default().execute_call();

        assert_err!(result, Error::<Test>::TokenIssuanceNotInIdleState);
    })
}

#[test]
fn activation_fails_when_amm_status_already_active() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default()
            .with_empty_allocation()
            .execute_call()
            .unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        let result = ActivateAmmFixture::default().execute_call();

        assert_err!(result, Error::<Test>::TokenIssuanceNotInIdleState);
    })
}

#[test]
fn amm_activation_successful() {
    let slope = Permill::from_perthousand(1);
    let intercept = Permill::from_perthousand(1);
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        ActivateAmmFixture::default()
            .with_linear_function_params(slope, intercept)
            .execute_call()
            .unwrap();

        let token = Token::token_info_by_id(1);
        assert_eq!(
            IssuanceState::of::<Test>(&token),
            IssuanceState::Amm(AmmCurve {
                slope,
                intercept,
                provided_supply: 0u32.into(),
            })
        );
    })
}

#[test]
fn amm_activation_ok_with_amm_treasury_account_having_existential_deposit() {
    let token_id = token!(1);
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        ActivateAmmFixture::default().execute_call().unwrap();

        let amm_treasury_account = Token::amm_treasury_account(token_id);
        assert_eq!(
            Balances::usable_balance(amm_treasury_account),
            ExistentialDeposit::get()
        );
    })
}

#[test]
fn amm_activation_ok_with_event_deposit() {
    let token_id = token!(1);
    let (creator_id, _) = member!(1);
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default()
            .with_linear_function_params(AMM_CURVE_SLOPE, AMM_CURVE_INTERCEPT)
            .execute_call()
            .unwrap();

        last_event_eq!(RawEvent::AmmActivated(
            token_id,
            creator_id,
            AmmCurve {
                slope: AMM_CURVE_SLOPE,
                intercept: AMM_CURVE_INTERCEPT,
                provided_supply: 0u32.into(),
            }
        ));
    })
}

// --------------------- amm_sell -------------------------------

#[test]
fn amm_sell_noop_ok_with_zero_requested_amount() {
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();
            let state_pre = sp_io::storage::root(sp_storage::StateVersion::V1);

            let result = AmmSellFixture::default()
                .with_amount(0u32.into())
                .execute_call();

            let state_post = sp_io::storage::root(sp_storage::StateVersion::V1);
            assert_ok!(result);
            assert_eq!(state_pre, state_post);
        })
}

#[test]
fn amm_sell_fails_with_user_not_having_leaking_funds_from_vesting_schedule() {
    const DURATION: u64 = 2 * DEFAULT_SALE_DURATION;
    let ((alice_id, alice_account), alice_joys) = (member!(2), joy!(5_000_000));
    let ((bob_id, bob_account), bob_joys) = (member!(3), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![
        (alice_account, alice_joys),
        (bob_account, bob_joys),
    ])
    .execute_with(|| {
        // ------------ arrange -----------------

        // 1. Create token
        IssueTokenFixture::default().execute_call().unwrap();

        // 2. issue a sale and have alice being vested
        InitTokenSaleFixture::default()
            .with_vesting_schedule_params(Some(VestingScheduleParamsOf::<Test> {
                linear_vesting_duration: DURATION,
                blocks_before_cliff: 0u64,
                cliff_amount_percentage: Permill::zero(),
            }))
            .execute_call()
            .unwrap();
        PurchaseTokensOnSaleFixture::default()
            .with_sender(alice_account)
            .with_member_id(alice_id)
            .with_amount(DEFAULT_AMM_BUY_AMOUNT)
            .call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        FinalizeTokenSaleFixture::default().call_and_assert(Ok(()));

        // 3. activate amm and have bob minting some tokens
        ActivateAmmFixture::default().execute_call().unwrap();
        AmmBuyFixture::default()
            .with_sender(bob_account)
            .with_member_id(bob_id)
            .with_amount(DEFAULT_AMM_BUY_AMOUNT)
            .execute_call()
            .unwrap();

        // ----------------- act -------------------
        let result = AmmSellFixture::default()
            .with_sender(alice_account)
            .with_member_id(alice_id)
            .with_amount(DEFAULT_AMM_BUY_AMOUNT)
            .execute_call();

        // ---------------- assert -----------------
        // Alice is now being vested but she has 0 transferrable amount
        assert_err!(result, Error::<Test>::InsufficientTokenBalance);
    })
}
#[test]
fn amm_sell_fails_with_user_not_having_enough_token_balance() {
    let ((user_id, user_account), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account, user_balance)]).execute_with(
        || {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default()
                .with_sender(user_account)
                .with_member_id(user_id)
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .execute_call()
                .unwrap();

            let result = AmmSellFixture::default()
                .with_amount(2 * DEFAULT_AMM_BUY_AMOUNT)
                .execute_call();

            assert_err!(result, Error::<Test>::InsufficientTokenBalance);
        },
    )
}

#[test]
fn amm_sell_fails_with_invalid_token_specified() {
    let token_id = token!(2);
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();

            let result = AmmSellFixture::default()
                .with_token_id(token_id)
                .execute_call();

            assert_err!(result, Error::<Test>::TokenDoesNotExist);
        })
}

#[test]
fn amm_sell_fails_with_invalid_account_info_specified() {
    let token_id = token!(1);
    let config = GenesisConfigBuilder::new_empty().build();
    let (user_member_id, user_account_id) = member!(3);
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        let result = AmmSellFixture::default()
            .with_sender(user_account_id)
            .with_member_id(user_member_id)
            .with_token_id(token_id)
            .execute_call();

        assert_err!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn amm_sell_fails_with_member_and_origin_auth() {
    let (_, sender) = member!(3);
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();

            let result = AmmSellFixture::default().with_sender(sender).execute_call();

            assert_err!(
                result,
                DispatchError::Other("origin signer not a member controller account")
            );
        })
}

#[test]
fn amm_sell_fails_with_token_not_in_amm_state() {
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();

            let result = AmmSellFixture::default().execute_call();

            assert_err!(result, Error::<Test>::NotInAmmState);
        })
}

#[test]
fn amm_sell_failed_with_slippage_constraint_violated() {
    let slippage_tolerance = (Permill::zero(), joy!(1_000_000_000));
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();

            let result = AmmSellFixture::default()
                .with_slippage_tolerance(slippage_tolerance)
                .execute_call();

            assert_err!(result, Error::<Test>::SlippageToleranceExceeded);
        })
}

#[test]
fn amm_treasury_balance_correctly_decreased_during_amm_sell() {
    let token_id = token!(1);
    let ((user_member_id, user_account_id), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default()
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .with_member_id(user_member_id)
                .execute_call()
                .unwrap();
            let amm_reserve_account = Token::amm_treasury_account(token_id);
            let amm_reserve_pre = Balances::usable_balance(amm_reserve_account);
            let correctly_computed_joy_amount =
                amm_function_values(DEFAULT_AMM_SELL_AMOUNT, token_id, AmmOperation::Sell);

            AmmSellFixture::default()
                .with_amount(DEFAULT_AMM_SELL_AMOUNT)
                .with_sender(user_account_id)
                .with_member_id(user_member_id)
                .execute_call()
                .unwrap();

            let amm_reserve_post = Balances::usable_balance(amm_reserve_account);
            assert_eq!(
                amm_reserve_pre - amm_reserve_post,
                correctly_computed_joy_amount
            );
        })
}

#[test]
fn amm_sell_ok_with_crt_issuance_decreased() {
    let token_id = token!(1);
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();
            let supply_pre = Token::token_info_by_id(token_id).total_supply;

            AmmSellFixture::default()
                .with_amount(DEFAULT_AMM_SELL_AMOUNT)
                .execute_call()
                .unwrap();

            let supply_post = Token::token_info_by_id(token_id).total_supply;
            assert_eq!(supply_pre - supply_post, DEFAULT_AMM_SELL_AMOUNT);
        })
}

#[test]
fn amm_sell_fails_with_amm_treasury_not_having_sufficient_usable_joy_required() {
    let token_id = token!(1);
    let (user_account_id, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();
            // setting the balance of teh amm_buy curve reserve to 0
            Balances::set_balance(
                Origin::root(),
                Token::amm_treasury_account(token_id),
                Balance::zero(),
                Balance::zero(),
            )
            .unwrap();

            let result = AmmSellFixture::default().execute_call();

            assert_err!(result, Error::<Test>::InsufficientJoyBalance);
        })
}

#[test]
fn amm_sell_ok_with_user_joy_balance_correctly_increased() {
    let token_id = token!(1);
    let (user_account, user_balance) = (member!(2).1, joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account, user_balance)]).execute_with(
        || {
            IssueTokenFixture::default()
                .with_empty_allocation()
                .execute_call()
                .unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();
            let user_reserve_pre = Balances::usable_balance(user_account);
            let correctly_computed_joy_amount =
                amm_function_values(DEFAULT_AMM_SELL_AMOUNT, token_id, AmmOperation::Sell);

            AmmSellFixture::default().execute_call().unwrap();

            let user_reserve_post = Balances::usable_balance(user_account);
            assert_eq!(
                user_reserve_post - user_reserve_pre,
                correctly_computed_joy_amount
            );
        },
    )
}

#[test]
fn amm_sell_ok_with_user_crt_amount_correctly_decreased() {
    let token_id = token!(1);
    let ((user_member_id, user_account_id), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default().execute_call().unwrap();
            let user_crt_pre =
                Token::account_info_by_token_and_member(token_id, user_member_id).amount;

            AmmSellFixture::default()
                .with_amount(DEFAULT_AMM_SELL_AMOUNT)
                .with_member_id(user_member_id)
                .with_sender(user_account_id)
                .execute_call()
                .unwrap();

            let user_crt_post =
                Token::account_info_by_token_and_member(token_id, user_member_id).amount;
            assert_eq!(user_crt_pre - user_crt_post, DEFAULT_AMM_SELL_AMOUNT);
        })
}

#[test]
fn amm_sell_ok_with_event_deposited() {
    let token_id = token!(1);
    let ((user_id, user_account), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account, user_balance)]).execute_with(
        || {
            IssueTokenFixture::default()
                .with_empty_allocation()
                .execute_call()
                .unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default()
                .with_sender(user_account)
                .with_member_id(user_id)
                .execute_call()
                .unwrap();
            let price = amm_function_values(DEFAULT_AMM_SELL_AMOUNT, token_id, AmmOperation::Sell);

            AmmSellFixture::default()
                .with_amount(DEFAULT_AMM_SELL_AMOUNT)
                .with_sender(user_account)
                .with_member_id(user_id)
                .execute_call()
                .unwrap();

            last_event_eq!(RawEvent::TokensSoldOnAmm(
                token_id,
                user_id,
                DEFAULT_AMM_SELL_AMOUNT,
                price,
            ));
        },
    )
}

// ------------------- DEACTIVATE ---------------------------------------

#[test]
fn deactivate_fails_with_token_not_in_amm_state() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = DeactivateAmmFixture::default().execute_call();

        assert_err!(result, Error::<Test>::NotInAmmState);
    })
}

#[test]
fn deactivate_fails_with_invalid_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();
    let token_id = token!(2);
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        let result = DeactivateAmmFixture::default()
            .with_token_id(token_id)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn deactivate_fails_with_too_much_amm_provided_supply_outstanding() {
    let amount = Permill::from_percent(10).mul_floor(DEFAULT_INITIAL_ISSUANCE);
    // give enough balance to bond amount
    let ((user_member_id, user_account_id), user_balance) =
        (member!(2), joy!(10_000_000_000_000_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default()
                .with_supply(1_000u128)
                .execute_call()
                .unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default()
                .with_amount(amount)
                .with_sender(user_account_id)
                .with_member_id(user_member_id)
                .execute_call()
                .unwrap();

            let result = DeactivateAmmFixture::default().execute_call();

            assert_err!(result, Error::<Test>::OutstandingAmmProvidedSupplyTooLarge);
        })
}

#[test]
fn deactivate_ok_with_status_set_to_idle() {
    let token_id = token!(1);
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        DeactivateAmmFixture::default().execute_call().unwrap();

        let token = Token::token_info_by_id(token_id);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

#[test]
fn deactivate_ok_with_amm_buy_curve_params_set_to_none() {
    let token_id = token!(1);
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default().execute_call().unwrap();

        DeactivateAmmFixture::default().execute_call().unwrap();

        let token = Token::token_info_by_id(token_id);
        assert!(token.amm_curve.is_none());
    })
}

#[test]
fn deactivate_ok_with_full_cycle_from_activation() {
    let token_id = token!(1);
    let ((user_member_id, user_account_id), user_balance) = (member!(2), joy!(5_000_000));
    build_default_test_externalities_with_balances(vec![(user_account_id, user_balance)])
        .execute_with(|| {
            IssueTokenFixture::default().execute_call().unwrap();
            ActivateAmmFixture::default().execute_call().unwrap();
            AmmBuyFixture::default()
                .with_sender(user_account_id)
                .with_member_id(user_member_id)
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .execute_call()
                .unwrap();

            AmmSellFixture::default()
                .with_sender(user_account_id)
                .with_member_id(user_member_id)
                .with_amount(DEFAULT_AMM_BUY_AMOUNT)
                .execute_call()
                .unwrap();

            DeactivateAmmFixture::default().execute_call().unwrap();

            let amm_treasury_account = Token::amm_treasury_account(token_id);
            assert_eq!(
                Balances::usable_balance(amm_treasury_account),
                ExistentialDeposit::get()
            );
        })
}

#[test]
fn amm_deactivation_ok_with_event_deposit() {
    let token_id = token!(1);
    let (creator_id, _) = member!(1);
    let amount_burned = 0;
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        ActivateAmmFixture::default()
            .with_token_id(token_id)
            .with_member_id(creator_id)
            .execute_call()
            .unwrap();

        DeactivateAmmFixture::default()
            .with_token_id(token_id)
            .with_member_id(creator_id)
            .execute_call()
            .unwrap();

        last_event_eq!(RawEvent::AmmDeactivated(
            token_id,
            creator_id,
            amount_burned
        ));
    })
}
