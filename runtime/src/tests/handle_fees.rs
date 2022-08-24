use super::{
    account_from_member_id, increase_total_balance_issuance_using_account_id, initial_test_ext,
};
use crate::{currency, AccountId, Balances, DealWithFees, NegativeImbalance};
use frame_support::traits::{Currency, OnUnbalanced};

#[test]
fn block_author_only_receives_tips() {
    initial_test_ext().execute_with(|| {
        fn author() -> AccountId {
            account_from_member_id(0).into()
        }

        fn user() -> AccountId {
            account_from_member_id(1).into()
        }

        let user_starting_balance = currency::DOLLARS * 5000;
        increase_total_balance_issuance_using_account_id(user(), user_starting_balance);

        let starting_total_issuance = Balances::total_issuance();

        let fees_amount = currency::DOLLARS * 1000;
        let tips_amount = currency::DOLLARS * 500;
        let (fees, _) = Balances::slash(&user(), fees_amount);
        let (tips, _) = Balances::slash(&user(), tips_amount);

        struct Recipient;
        impl OnUnbalanced<NegativeImbalance> for Recipient {
            fn on_nonzero_unbalanced(amount: NegativeImbalance) {
                Balances::resolve_creating(&author(), amount);
            }
        }

        DealWithFees::<Recipient>::on_unbalanceds(vec![fees, tips].into_iter());

        // Author only receive tips
        assert_eq!(Balances::free_balance(&author()), tips_amount,);

        // Transaction fees have been burned
        assert_eq!(
            Balances::total_issuance(),
            starting_total_issuance - fees_amount
        );
    });
}
