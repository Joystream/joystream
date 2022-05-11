#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::types::*;
use crate::utils::{build_merkle_path_helper, generate_merkle_root_helper};
use crate::Module as Token;
use frame_benchmarking::{account, benchmarks, Zero};
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use sp_runtime::{traits::Hash, Permill};
use sp_std::{boxed::Box, vec, vec::Vec};

// ----- DEFAULTS

const SEED: u32 = 0;
const DEFAULT_TOKEN_ISSUANCE: u32 = 1_000_000_000;
// Transfers
const MAX_TX_OUTPUTS: u32 = 1024;
const DEFAULT_TX_AMOUNT: u32 = 100;
// Whitelist
const MAX_MERKLE_PROOF_HASHES: u32 = 10;
// Sales
const DEFAULT_SALE_DURATION: u32 = 14400;
const DEFAULT_SALE_UNIT_PRICE: u32 = 1;
const DEFAULT_SALE_PURCHASE: u32 = 100;
// Revenue splits
const DEFAULT_SPLIT_DURATION: u32 = 14400;
const DEFAULT_SPLIT_ALLOCATION: u32 = 1_000_000;
const DEFAULT_SPLIT_PARTICIPATION: u32 = 300_000_000;
const DEFAULT_SPLIT_PAYOUT: u32 = 300_000;
// Patronage
const DEFAULT_PATRONAGE: YearlyRate = YearlyRate(Permill::from_percent(1));

// ----- HELPERS

fn token_owner_account<T: Trait>() -> T::AccountId {
    account::<T::AccountId>("owner", 0, SEED)
}

fn issue_token<T: Trait>(
    transfer_policy: TransferPolicyParamsOf<T>,
) -> Result<T::TokenId, DispatchError> {
    let token_id = Token::<T>::next_token_id();
    Token::<T>::issue_token(
        token_owner_account::<T>(),
        TokenIssuanceParametersOf::<T> {
            /// Initial issuance
            initial_allocation: [(
                token_owner_account::<T>(),
                TokenAllocation {
                    amount: DEFAULT_TOKEN_ISSUANCE.into(),
                    vesting_schedule: None,
                },
            )]
            .iter()
            .cloned()
            .collect(),
            symbol: <T as frame_system::Trait>::Hashing::hash_of(b"CRT"),
            transfer_policy,
            patronage_rate: DEFAULT_PATRONAGE,
        },
        UploadContextOf::<T>::default(),
    )?;
    Ok(token_id)
}

fn init_token_sale<T: Trait>(token_id: T::TokenId) -> Result<TokenSaleId, DispatchError> {
    Token::<T>::init_token_sale(
        token_id,
        TokenSaleParamsOf::<T> {
            tokens_source: token_owner_account::<T>(),
            unit_price: DEFAULT_SALE_UNIT_PRICE.into(),
            upper_bound_quantity: DEFAULT_SALE_PURCHASE.into(),
            starts_at: None,
            duration: DEFAULT_SALE_DURATION.into(),
            cap_per_member: Some(DEFAULT_SALE_PURCHASE.into()),
            vesting_schedule: None,
            metadata: None,
        },
    )?;
    let token_data = Token::<T>::token_info_by_id(token_id);
    Ok(token_data.sales_initialized)
}

fn issue_revenue_split<T: Trait>(token_id: T::TokenId) -> DispatchResult {
    // top up owner JOY balance
    let _ = Joy::<T>::deposit_creating(
        &token_owner_account::<T>(),
        T::JoyExistentialDeposit::get() + DEFAULT_SPLIT_ALLOCATION.into(),
    );

    Token::<T>::issue_revenue_split(
        token_id,
        None,
        DEFAULT_SPLIT_DURATION.into(),
        token_owner_account::<T>(),
        DEFAULT_SPLIT_ALLOCATION.into(),
    )
}

fn participate_in_revenue_split<T: Trait>(token_id: T::TokenId) -> DispatchResult {
    Token::<T>::participate_in_split(
        RawOrigin::Signed(token_owner_account::<T>()).into(),
        token_id,
        DEFAULT_SPLIT_PARTICIPATION.into(),
    )
}

fn setup_account_with_max_number_of_locks<T: Trait>(
    token_id: T::TokenId,
    account_id: &T::AccountId,
) {
    AccountInfoByTokenAndAccount::<T>::mutate(token_id, &account_id, |a| {
        (0u32..T::MaxVestingSchedulesPerAccountPerToken::get().into()).for_each(|i| {
            a.add_or_update_vesting_schedule(
                VestingSource::Sale(i),
                VestingSchedule {
                    duration: 0u32.into(),
                    start_block: u32::MAX.into(),
                    cliff_amount: TokenBalanceOf::<T>::one(),
                    post_cliff_total_amount: TokenBalanceOf::<T>::zero(),
                },
                None,
            );
        });
        a.split_staking_status = Some(StakingStatus {
            split_id: 0u32,
            amount: TokenBalanceOf::<T>::one(),
        });
        a.increase_amount_by(TokenBalanceOf::<T>::one());
    });
}

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = frame_system::Module::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    assert!(
        events.len() > 0,
        "If you are checking for last event there must be at least 1 event"
    );
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

// ----- BENCHMARKS

benchmarks! {
    where_clause {
        where T: Trait
    }
    _ { }

    // Worst case scenario:
    // - source_accout.vesting_schedules.len() is T::MaxVestingSchedulesPerAccountPerToken
    // - source_account.split_staking_status is Some(_)
    // - destination accounts do not exist (need to be created)
    // - bloat_bond is non-zero
    transfer {
        let o in 1 .. MAX_TX_OUTPUTS;

        let owner = token_owner_account::<T>();
        let outputs = Transfers::<_, _>(
            (0..o)
            .map(|i| (
                account::<T::AccountId>("dst", i, SEED),
                Payment::<<T as Trait>::Balance> {
                    remark: vec![],
                    amount: DEFAULT_TX_AMOUNT.into()
                }
            ))
            .collect()
        );
        let bloat_bond: JoyBalanceOf<T> = 100u32.into();

        let _ = Joy::<T>::deposit_creating(
            &owner,
            T::JoyExistentialDeposit::get() +
            bloat_bond * o.into()
        );
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        setup_account_with_max_number_of_locks::<T>(token_id, &owner);
        BloatBond::<T>::set(bloat_bond);
    }: _(
        RawOrigin::Signed(owner.clone()),
        token_id,
        outputs.clone()
    )
    verify {
        outputs.0.keys().for_each(|a| {
            assert_eq!(
                AccountInfoByTokenAndAccount::<T>::get(token_id, a).amount,
                DEFAULT_TX_AMOUNT.into()
            );
        });
        assert_last_event::<T>(
            RawEvent::TokenAmountTransferred(
                token_id,
                owner.clone(),
                Transfers(
                    outputs
                        .iter()
                        .map(|(a, p)| (Validated::NonExisting(a.clone()), p.clone()))
                        .collect()
                )
            ).into()
        );
        // Ensure bloat_bond was transferred
        assert_eq!(
            Joy::<T>::usable_balance(&owner),
            T::JoyExistentialDeposit::get()
        )
    }

    // Worst case scenario:
    // - account's bloat_bond is non-zero
    // - unclaimed patronage is non-zero
    dust_account {
        let owner = token_owner_account::<T>();
        let bloat_bond: JoyBalanceOf<T> = 100u32.into();

        BloatBond::<T>::set(bloat_bond);
        let _ = Joy::<T>::deposit_creating(&owner, T::JoyExistentialDeposit::get() + bloat_bond);
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        // Ensure bloat_bond was transferred
        assert_eq!(
            Joy::<T>::usable_balance(&owner),
            T::JoyExistentialDeposit::get()
        );
        // Move some blocks into the future to make sure unclaimed patronage is non-zero
        let tally_update_block_number = System::<T>::block_number() + T::BlocksPerYear::get().into();
        System::<T>::set_block_number(tally_update_block_number);
    }: _(
        RawOrigin::Signed(owner.clone()),
        token_id,
        owner.clone()
    )
    verify {
        assert!(!AccountInfoByTokenAndAccount::<T>::contains_key(token_id, &owner));
        assert_last_event::<T>(
            RawEvent::AccountDustedBy(
                token_id,
                owner.clone(),
                owner,
                TransferPolicy::Permissionless
            ).into()
        );
        // Make sure patronage tally was updated
        assert_eq!(
            Token::<T>::token_info_by_id(token_id).patronage_info.last_unclaimed_patronage_tally_block,
            tally_update_block_number
        )
    }

    // Worst case scenario:
    // - bloat_bond is non-zero
    join_whitelist {
        let h in 1 .. MAX_MERKLE_PROOF_HASHES;

        let whitelisted_accounts: Vec<T::AccountId> = (0..2u32.pow(h)).map(|i|
            account::<T::AccountId>("whitelisted", i, SEED),
        ).collect();
        let acc = whitelisted_accounts[0].clone();
        let commitment = generate_merkle_root_helper::<T, _>(&whitelisted_accounts).pop().unwrap();
        let proof = MerkleProof::<<T as frame_system::Trait>::Hashing>(
            build_merkle_path_helper::<T, _>(&whitelisted_accounts, 0)
        );
        let transfer_policy_params = TransferPolicyParamsOf::<T>::Permissioned(WhitelistParams {
            commitment,
            payload: None
        });
        let bloat_bond: JoyBalanceOf<T> = 100u32.into();


        // Make sure that proof.0.len() is h
        assert_eq!(proof.0.len() as u32, h);

        let _ = Joy::<T>::deposit_creating(&acc, T::JoyExistentialDeposit::get() + bloat_bond);
        let token_id = issue_token::<T>(transfer_policy_params.clone())?;
        BloatBond::<T>::set(bloat_bond);
    }: _(
        RawOrigin::Signed(acc.clone()),
        token_id,
        proof
    )
    verify {
        assert!(AccountInfoByTokenAndAccount::<T>::contains_key(token_id, &acc));
        assert_last_event::<T>(
            RawEvent::MemberJoinedWhitelist(
                token_id,
                acc.clone(),
                transfer_policy_params.into()
            ).into()
        );
        // Ensure bloat_bond was transferred
        assert_eq!(
            Joy::<T>::usable_balance(&acc),
            T::JoyExistentialDeposit::get()
        );
    }

    // Worst case scenario:
    // - new account needs to be created
    // - cap per member exists
    // - bloat_bond is non-zero
    purchase_tokens_on_sale {
        let participant = account::<T::AccountId>("participant", 0, SEED);
        let bloat_bond: JoyBalanceOf<T> = 100u32.into();

        let _ = Joy::<T>::deposit_creating(
            &participant,
            T::JoyExistentialDeposit::get() +
            bloat_bond +
            (DEFAULT_SALE_PURCHASE * DEFAULT_SALE_UNIT_PRICE).into()
        );
        // Issue token and initialize sale
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        let sale_id = init_token_sale::<T>(token_id)?;
        BloatBond::<T>::set(bloat_bond);
    }: _(
        RawOrigin::Signed(participant.clone()),
        token_id,
        DEFAULT_SALE_PURCHASE.into()
    )
    verify {
        assert_eq!(Token::<T>::account_info_by_token_and_account(
            token_id, &participant
        ), AccountData {
            amount: DEFAULT_SALE_PURCHASE.into(),
            vesting_schedules: vec![
                (
                    VestingSource::Sale(sale_id),
                    Token::<T>::token_info_by_id(token_id)
                        .last_sale
                        .unwrap()
                        .get_vesting_schedule(DEFAULT_SALE_PURCHASE.into())
                )
            ].iter().cloned().collect(),
            split_staking_status: None,
            bloat_bond,
        });
        assert_last_event::<T>(
            RawEvent::TokensPurchasedOnSale(
                token_id,
                sale_id,
                DEFAULT_SALE_PURCHASE.into(),
                participant.clone()
            ).into()
        );
        // Ensure bloat_bond was transferred
        assert_eq!(
            Joy::<T>::usable_balance(&participant),
            T::JoyExistentialDeposit::get()
        );
    }

    recover_unsold_tokens {
        let owner = token_owner_account::<T>();

        // Issue token and initialize sale
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        let sale_id = init_token_sale::<T>(token_id)?;
        System::<T>::set_block_number(
            System::<T>::block_number().saturating_add(DEFAULT_SALE_DURATION.into())
        );
    }: _(
        RawOrigin::Signed(owner.clone()),
        token_id
    )
    verify {
        assert_eq!(
            Token::<T>::account_info_by_token_and_account(token_id, &owner).amount,
            DEFAULT_TOKEN_ISSUANCE.into()
        );
        assert_last_event::<T>(
            RawEvent::UnsoldTokensRecovered(
                token_id,
                sale_id,
                DEFAULT_SALE_PURCHASE.into()
            ).into()
        );
    }

    participate_in_split {
        let owner = token_owner_account::<T>();

        // Issue token and issue revenue split
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        issue_revenue_split::<T>(token_id)?;
    }: _(
        RawOrigin::Signed(owner.clone()),
        token_id,
        DEFAULT_SPLIT_PARTICIPATION.into()
    )
    verify {
        assert_eq!(
            Token::<T>::account_info_by_token_and_account(token_id, &owner).staked(),
            DEFAULT_SPLIT_PARTICIPATION.into()
        );
        assert_eq!(
            Joy::<T>::usable_balance(&owner),
            T::JoyExistentialDeposit::get() + DEFAULT_SPLIT_PAYOUT.into()
        );
        assert_last_event::<T>(
            RawEvent::UserParticipatedInSplit(
                token_id,
                owner,
                DEFAULT_SPLIT_PARTICIPATION.into(),
                DEFAULT_SPLIT_PAYOUT.into(),
                1u32
            ).into()
        );
    }

    abandon_revenue_split {
        let owner = token_owner_account::<T>();

        // Issue token and issue revenue split
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        issue_revenue_split::<T>(token_id)?;
        // Participate in split
        participate_in_revenue_split::<T>(token_id)?;
        // Go to: Split end
        System::<T>::set_block_number(System::<T>::block_number() + DEFAULT_SPLIT_DURATION.into());
    }: _(
        RawOrigin::Signed(owner.clone()),
        token_id
    )
    verify {
        assert!(Token::<T>::account_info_by_token_and_account(token_id, &owner).split_staking_status.is_none());
        assert_last_event::<T>(
            RawEvent::RevenueSplitLeft(
                token_id,
                owner,
                DEFAULT_SPLIT_PARTICIPATION.into()
            ).into()
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mock::{build_test_externalities, GenesisConfigBuilder, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_transfer() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_transfer::<Test>());
        });
    }

    #[test]
    fn test_dust_account() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_dust_account::<Test>());
        });
    }

    #[test]
    fn test_join_whitelist() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_join_whitelist::<Test>());
        });
    }

    #[test]
    fn test_purchase_tokens_on_sale() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_purchase_tokens_on_sale::<Test>());
        });
    }

    #[test]
    fn test_recover_unsold_tokens() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_recover_unsold_tokens::<Test>());
        });
    }

    #[test]
    fn test_participate_in_split() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_participate_in_split::<Test>());
        });
    }

    #[test]
    fn test_abandon_revenue_split() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_abandon_revenue_split::<Test>());
        });
    }
}
