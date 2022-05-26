#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::types::*;
use crate::utils::{build_merkle_path_helper, generate_merkle_root_helper};
use crate::Module as Token;
use balances::Module as Balances;
use common::membership::MembershipTypes;
use frame_benchmarking::{account, benchmarks, Zero};
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use membership::{BuyMembershipParameters, Module as Members};
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

fn create_member<T: Trait>(
    account_id: &T::AccountId,
    handle: &str,
) -> <T as MembershipTypes>::MemberId {
    let member_id = Members::<T>::members_created();
    let _ = Balances::<T>::deposit_creating(account_id, Members::<T>::membership_price());
    Members::<T>::buy_membership(
        RawOrigin::Signed(account_id.clone()).into(),
        BuyMembershipParameters {
            controller_account: account_id.clone(),
            root_account: account_id.clone(),
            handle: Some(handle.as_bytes().to_vec()),
            ..Default::default()
        },
    )
    .unwrap();
    member_id
}

fn create_owner<T: Trait>() -> (<T as MembershipTypes>::MemberId, T::AccountId) {
    let owner_account = token_owner_account::<T>();
    let owner_member_id = create_member::<T>(&owner_account, "owner");
    (owner_member_id, owner_account)
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
                T::MemberId::zero(),
                TokenAllocation {
                    amount: DEFAULT_TOKEN_ISSUANCE.into(),
                    vesting_schedule_params: None,
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
    let sale_id = Token::<T>::token_info_by_id(token_id).next_sale_id;
    Token::<T>::init_token_sale(
        token_id,
        TokenSaleParamsOf::<T> {
            tokens_source: T::MemberId::zero(),
            unit_price: DEFAULT_SALE_UNIT_PRICE.into(),
            upper_bound_quantity: DEFAULT_TOKEN_ISSUANCE.into(),
            starts_at: None,
            duration: DEFAULT_SALE_DURATION.into(),
            cap_per_member: Some(DEFAULT_SALE_PURCHASE.into()),
            vesting_schedule_params: Some(VestingScheduleParams {
                blocks_before_cliff: 100u32.into(),
                cliff_amount_percentage: Permill::from_percent(100),
                linear_vesting_duration: 0u32.into(),
            }),
            metadata: None,
        },
    )?;
    Ok(sale_id)
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
        T::MemberId::zero(),
        DEFAULT_SPLIT_PARTICIPATION.into(),
    )
}

fn setup_account_with_max_number_of_locks<T: Trait>(token_id: T::TokenId, member_id: &T::MemberId) {
    AccountInfoByTokenAndMember::<T>::mutate(token_id, member_id, |a| {
        (0u32..T::MaxVestingSchedulesPerAccountPerToken::get().into()).for_each(|i| {
            a.add_or_update_vesting_schedule(
                VestingSource::Sale(i),
                VestingSchedule {
                    linear_vesting_duration: 0u32.into(),
                    linear_vesting_start_block: u32::MAX.into(),
                    cliff_amount: TokenBalanceOf::<T>::one(),
                    post_cliff_total_amount: TokenBalanceOf::<T>::zero(),
                    burned_amount: TokenBalanceOf::<T>::zero(),
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

        let (owner_member_id, owner_account) = create_owner::<T>();
        let outputs = Transfers::<_, _>(
            (1..=o)
            .map(|i| (
                i.saturated_into(),
                Payment::<<T as Trait>::Balance> {
                    remark: vec![],
                    amount: DEFAULT_TX_AMOUNT.into()
                }
            ))
            .collect()
        );
        let bloat_bond: JoyBalanceOf<T> = 100u32.into();

        let _ = Joy::<T>::deposit_creating(
            &owner_account,
            T::JoyExistentialDeposit::get() +
            bloat_bond * o.into()
        );
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        setup_account_with_max_number_of_locks::<T>(token_id, &owner_member_id);
        BloatBond::<T>::set(bloat_bond);
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        owner_member_id,
        token_id,
        outputs.clone()
    )
    verify {
        outputs.0.keys().for_each(|m| {
            assert_eq!(
                AccountInfoByTokenAndMember::<T>::get(token_id, m).amount,
                DEFAULT_TX_AMOUNT.into()
            );
        });
        assert_last_event::<T>(
            RawEvent::TokenAmountTransferred(
                token_id,
                owner_member_id,
                Transfers(
                    outputs
                        .0
                        .iter()
                        .map(|(m, p)| (Validated::NonExisting(m.clone()), ValidatedPayment::from(PaymentWithVesting::from(p.clone()))))
                        .collect()
                )
            ).into()
        );
        // Ensure bloat_bond was transferred
        assert_eq!(
            Joy::<T>::usable_balance(&owner_account),
            T::JoyExistentialDeposit::get()
        )
    }

    // Worst case scenario:
    // - account's bloat_bond is non-zero
    // - token policy is Permissioned
    dust_account {
        let (owner_member_id, owner_account) = create_owner::<T>();
        let bloat_bond: JoyBalanceOf<T> = 100u32.into();

        BloatBond::<T>::set(bloat_bond);
        let module_account = Token::<T>::module_treasury_account();
        let _ = Joy::<T>::deposit_creating(&owner_account, T::JoyExistentialDeposit::get() + bloat_bond);
        // This is needed, because `add_extra_genesis` seems not to work during benchmarks:
        let _ = Joy::<T>::deposit_creating(&module_account, T::JoyExistentialDeposit::get());

        // Issue token
        let commitment = <T as frame_system::Trait>::Hashing::hash_of(b"commitment");
        let policy_params = TransferPolicyParams::Permissioned(WhitelistParams {
            commitment,
            payload: None
        });
        let token_id = issue_token::<T>(policy_params)?;

        // Ensure bloat_bond was transferred
        assert_eq!(
            Joy::<T>::usable_balance(&owner_account),
            T::JoyExistentialDeposit::get()
        );
        // Burn all owner tokens
        Token::<T>::burn(
            RawOrigin::Signed(owner_account.clone()).into(),
            token_id,
            owner_member_id.clone(),
            DEFAULT_TOKEN_ISSUANCE.into()
        )?;
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        token_id,
        owner_member_id
    )
    verify {
        assert!(!AccountInfoByTokenAndMember::<T>::contains_key(token_id, &owner_member_id));
        assert_last_event::<T>(
            RawEvent::AccountDustedBy(
                token_id,
                owner_member_id,
                owner_account,
                TransferPolicy::Permissioned(commitment)
            ).into()
        );
    }

    // Worst case scenario:
    // - bloat_bond is non-zero
    join_whitelist {
        let h in 1 .. MAX_MERKLE_PROOF_HASHES;

        create_owner::<T>();
        let whitelisted_members: Vec<T::MemberId> = (1..=2u32.pow(h)).map(|i|
            i.saturated_into()
        ).collect();
        let acc = account::<T::AccountId>("whitelisted", 0, SEED);
        let member_id = create_member::<T>(&acc, "whitelisted");
        let commitment = generate_merkle_root_helper::<T, _>(&whitelisted_members).pop().unwrap();
        let proof = MerkleProof::<<T as frame_system::Trait>::Hashing>(
            build_merkle_path_helper::<T, _>(&whitelisted_members, 0)
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
        member_id,
        token_id,
        proof
    )
    verify {
        assert!(AccountInfoByTokenAndMember::<T>::contains_key(token_id, &member_id));
        assert_last_event::<T>(
            RawEvent::MemberJoinedWhitelist(
                token_id,
                member_id,
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
    // - sale has a vesting schedule
    // - cap per member exists
    // - bloat_bond is non-zero
    // - platform_fee is set
    purchase_tokens_on_sale {
        create_owner::<T>();
        let participant = account::<T::AccountId>("participant", 0, SEED);
        let member_id = create_member::<T>(&participant, "participant");
        let bloat_bond: JoyBalanceOf<T> = 100u32.into();
        let platform_fee = Permill::from_percent(10);

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
        SalePlatformFee::set(platform_fee);
    }: _(
        RawOrigin::Signed(participant.clone()),
        token_id,
        member_id,
        DEFAULT_SALE_PURCHASE.into()
    )
    verify {
        assert_eq!(Token::<T>::account_info_by_token_and_member(
            token_id, &member_id
        ), AccountData {
            amount: DEFAULT_SALE_PURCHASE.into(),
            vesting_schedules: vec![
                (
                    VestingSource::Sale(sale_id),
                    Token::<T>::token_info_by_id(token_id)
                        .sale
                        .unwrap()
                        .get_vesting_schedule(DEFAULT_SALE_PURCHASE.into())
                        .unwrap()
                )
            ].iter().cloned().collect(),
            split_staking_status: None,
            last_sale_total_purchased_amount: Some((sale_id, DEFAULT_SALE_PURCHASE.into())),
            next_vesting_transfer_id: 0,
            bloat_bond,
        });
        assert_last_event::<T>(
            RawEvent::TokensPurchasedOnSale(
                token_id,
                sale_id,
                DEFAULT_SALE_PURCHASE.into(),
                member_id
            ).into()
        );
        // Ensure bloat_bond was transferred
        assert_eq!(
            Joy::<T>::usable_balance(&participant),
            T::JoyExistentialDeposit::get()
        );
    }

    recover_unsold_tokens {
        let (owner_member_id, owner_account) = create_owner::<T>();

        // Issue token and initialize sale
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        let sale_id = init_token_sale::<T>(token_id)?;
        System::<T>::set_block_number(
            System::<T>::block_number().saturating_add(DEFAULT_SALE_DURATION.into())
        );
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        token_id
    )
    verify {
        assert_eq!(
            Token::<T>::account_info_by_token_and_member(token_id, &owner_member_id).amount,
            DEFAULT_TOKEN_ISSUANCE.into()
        );
        assert_last_event::<T>(
            RawEvent::UnsoldTokensRecovered(
                token_id,
                sale_id,
                DEFAULT_TOKEN_ISSUANCE.into()
            ).into()
        );
    }

    // Worst case scenario:
    // - dividend_amount/payout is non-zero
    participate_in_split {
        let (owner_member_id, owner_account) = create_owner::<T>();

        // Issue token and issue revenue split
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        issue_revenue_split::<T>(token_id)?;
        System::<T>::set_block_number(
            System::<T>::block_number().saturating_add(Token::<T>::min_revenue_split_time_to_start())
        );
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        token_id,
        owner_member_id,
        DEFAULT_SPLIT_PARTICIPATION.into()
    )
    verify {
        assert_eq!(
            Token::<T>::account_info_by_token_and_member(token_id, &owner_member_id).staked(),
            DEFAULT_SPLIT_PARTICIPATION.into()
        );
        assert_eq!(
            Joy::<T>::usable_balance(&owner_account),
            T::JoyExistentialDeposit::get() + DEFAULT_SPLIT_PAYOUT.into()
        );
        assert_last_event::<T>(
            RawEvent::UserParticipatedInSplit(
                token_id,
                owner_member_id,
                DEFAULT_SPLIT_PARTICIPATION.into(),
                DEFAULT_SPLIT_PAYOUT.into(),
                0u32
            ).into()
        );
    }

    // Worst case scenario:
    // - exiting current split
    // - current split is active, but no longer ongoing
    exit_revenue_split {
        let (owner_member_id, owner_account) = create_owner::<T>();

        // Issue token and issue revenue split
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        issue_revenue_split::<T>(token_id)?;
        System::<T>::set_block_number(
            System::<T>::block_number().saturating_add(Token::<T>::min_revenue_split_time_to_start())
        );
        // Participate in split
        participate_in_revenue_split::<T>(token_id)?;
        // Go to: Split end
        System::<T>::set_block_number(System::<T>::block_number() + DEFAULT_SPLIT_DURATION.into());
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        token_id,
        owner_member_id
    )
    verify {
        assert!(Token::<T>::account_info_by_token_and_member(token_id, &owner_member_id).split_staking_status.is_none());
        assert_last_event::<T>(
            RawEvent::RevenueSplitLeft(
                token_id,
                owner_member_id,
                DEFAULT_SPLIT_PARTICIPATION.into()
            ).into()
        );
    }

    // Worst case scenario:
    // - account has max number of vesting_schedules
    // - account has a staking status set
    // - all funds are burned
    burn {
        let (owner_member_id, owner_account) = create_owner::<T>();
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        setup_account_with_max_number_of_locks::<T>(token_id, &owner_member_id);
        let amount_to_burn = Token::<T>::account_info_by_token_and_member(token_id, &owner_member_id).amount;
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        token_id,
        owner_member_id,
        amount_to_burn
    )
    verify {
        assert_eq!(
            Token::<T>::ensure_account_data_exists(token_id, &owner_member_id).unwrap(),
            AccountDataOf::<T> {
            split_staking_status: Some(StakingStatus {
                split_id: 0,
                amount: TokenBalanceOf::<T>::zero()
            }),
            ..Default::default()
        });
        assert_last_event::<T>(
            RawEvent::TokensBurned(
                token_id,
                owner_member_id,
                amount_to_burn
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
    fn test_exit_revenue_split() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_exit_revenue_split::<Test>());
        });
    }

    #[test]
    fn test_burn() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_burn::<Test>());
        });
    }
}
