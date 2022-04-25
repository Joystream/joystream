#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::types::*;
use crate::utils::{build_merkle_path_helper, generate_merkle_root_helper};
use crate::Module as Token;
use frame_benchmarking::{account, benchmarks, Zero};
use frame_system::EventRecord;
use frame_system::RawOrigin;
use sp_runtime::traits::Hash;
use sp_std::{boxed::Box, vec, vec::Vec};
use storage::BagId;

const SEED: u32 = 0;
const MAX_TX_OUTPUTS: u32 = 1024;
const MAX_MERKLE_PROOF_HASHES: u32 = 10;
const DEFAULT_SALE_DURATION: u32 = 100;

fn token_owner_account<T: Trait>() -> T::AccountId {
    account::<T::AccountId>("owner", 0, SEED)
}

fn issue_token<T: Trait>(
    supply: <T as Trait>::Balance,
    transfer_policy: TransferPolicyOf<T>,
) -> Result<T::TokenId, DispatchError> {
    let token_id = Token::<T>::next_token_id();
    Token::<T>::issue_token(TokenIssuanceParametersOf::<T> {
        /// Initial issuance
        initial_allocation: InitialAllocationOf::<T> {
            address: token_owner_account::<T>(),
            amount: supply,
            vesting_schedule: None,
        },
        symbol: <T as frame_system::Trait>::Hashing::hash_of(b"CRT"),
        transfer_policy,
        patronage_rate: <T as Trait>::Balance::zero(),
    })?;
    Ok(token_id)
}

fn init_token_sale<T: Trait>(
    token_id: T::TokenId,
    amount: <T as Trait>::Balance,
    whitelist_commitment: Option<<T as frame_system::Trait>::Hash>,
) -> Result<TokenSaleId, DispatchError> {
    Token::<T>::init_token_sale(
        token_id,
        TokenSaleParamsOf::<T> {
            tokens_source: token_owner_account::<T>(),
            unit_price: <T as balances::Trait>::Balance::one(),
            upper_bound_quantity: amount,
            starts_at: None,
            duration: DEFAULT_SALE_DURATION.into(),
            whitelist: whitelist_commitment.map(|commitment| WhitelistParamsOf::<T> {
                commitment,
                payload: None,
            }),
            vesting_schedule: None,
            metadata: None,
        },
        UploadContextOf::<T> {
            uploader_account: token_owner_account::<T>(),
            bag_id: BagId::<T>::default(),
        },
    )?;
    let token_data = Token::<T>::token_info_by_id(token_id);
    Ok(token_data.sales_initialized)
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
                    cliff_amount: <T as Trait>::Balance::one(),
                    post_cliff_total_amount: <T as Trait>::Balance::zero(),
                },
                None,
            );
        });
        a.split_staking_status = Some(StakingStatus {
            split_id: 0u32,
            amount: <T as Trait>::Balance::one(),
        });
        a.increase_amount_by(<T as Trait>::Balance::one());
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

benchmarks! {
    where_clause {
        where T: Trait
    }
    _ { }

    // Worst case scenario:
    // - source_accout.vesting_schedules.len() is T::MaxVestingSchedulesPerAccountPerToken
    // - source_account.split_staking_status is Some(_)
    // - destination accounts do not exist (need to be created)
    transfer {
        let o in 1 .. MAX_TX_OUTPUTS;

        let tx_amount = <T as Trait>::Balance::from(100u32);
        let owner = token_owner_account::<T>();
        let outputs = Transfers::<_, _>(
            (0..o)
            .map(|i| (
                account::<T::AccountId>("dst", i, SEED),
                Payment::<<T as Trait>::Balance> {
                    remark: vec![],
                    amount: tx_amount
                }
            ))
            .collect()
        );

        let token_id = issue_token::<T>(
            tx_amount.saturating_mul(o.into()),
            TransferPolicy::Permissionless
        )?;
        T::ReserveCurrency::deposit_creating(&owner, T::BloatBond::get() * o.into());
        setup_account_with_max_number_of_locks::<T>(token_id, &owner);
    }: _(
        RawOrigin::Signed(owner.clone()),
        token_id,
        outputs.clone()
    )
    verify {
        outputs.0.keys().for_each(|a| {
            assert_eq!(
                AccountInfoByTokenAndAccount::<T>::get(token_id, a).amount,
                tx_amount
            );
        });
        assert_last_event::<T>(
            RawEvent::TokenAmountTransferred(
                token_id,
                owner,
                outputs.into()
            ).into()
        );
    }

    dust_account {
        let owner = token_owner_account::<T>();
        let token_id = issue_token::<T>(
            <T as Trait>::Balance::zero(),
            TransferPolicy::Permissionless
        )?;
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
    }

    join_whitelist {
        let h in 1 .. MAX_MERKLE_PROOF_HASHES;

        let whitelisted_accounts: Vec<T::AccountId> = (0..2u32.pow(h)).map(|i|
            account::<T::AccountId>("whitelisted", i, SEED),
        ).collect();
        let acc = whitelisted_accounts[0].clone();
        T::ReserveCurrency::deposit_creating(&acc, T::BloatBond::get());
        let commitment = generate_merkle_root_helper::<T, _>(&whitelisted_accounts).pop().unwrap();
        let proof = MerkleProof::<<T as frame_system::Trait>::Hashing>(
            Some(build_merkle_path_helper::<T, _>(&whitelisted_accounts, 0))
        );
        let transfer_policy = TransferPolicyOf::<T>::Permissioned(commitment);

        // Make sure that proof.0.len() is h
        assert_eq!(proof.0.as_ref().unwrap().len() as u32, h);

        let token_id = issue_token::<T>(<T as Trait>::Balance::zero(), transfer_policy.clone())?;
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
                acc,
                transfer_policy
            ).into()
        );
    }

    // Worst case scenario:
    // - New account needs to be created
    // - Buyer cap exists
    purchase_tokens_on_sale_with_proof {
        let h in 1 .. MAX_MERKLE_PROOF_HASHES;

        let purchase_amount: <T as Trait>::Balance = 100u32.into();
        let issuance: <T as Trait>::Balance = 1_000_000_000u32.into();
        let whitelisted_participants: Vec<WhitelistedSaleParticipantOf<T>> = (0..2u32.pow(h))
            .map(|i| WhitelistedSaleParticipant {
                address: account::<T::AccountId>("participant", i, SEED),
                cap: Some(purchase_amount)
            })
            .collect();
        let participant = whitelisted_participants[0].clone();
        let bloat_bond: u32 = T::BloatBond::get().saturated_into();
        let _ = balances::Module::<T>::deposit_creating(
            &participant.address,
            purchase_amount.saturating_add(bloat_bond.into()).into()
        );
        let commitment = generate_merkle_root_helper::<T, _>(&whitelisted_participants)
            .pop()
            .unwrap();
        let proof = SaleAccessProofOf::<T> {
            participant: participant.clone(),
            proof: MerkleProof::<<T as frame_system::Trait>::Hashing>(
                Some(build_merkle_path_helper::<T, _>(&whitelisted_participants, 0))
            )
        };

        // Make sure that proof.proof.0.len() is h
        assert_eq!(proof.proof.0.as_ref().unwrap().len() as u32, h);

        // Issue token and initialize sale
        let token_id = issue_token::<T>(issuance, TransferPolicyOf::<T>::Permissionless)?;
        let sale_id = init_token_sale::<T>(token_id, issuance, Some(commitment))?;
    }: purchase_tokens_on_sale(
        RawOrigin::Signed(participant.address.clone()),
        token_id,
        purchase_amount,
        Some(proof)
    )
    verify {
        assert_eq!(Token::<T>::account_info_by_token_and_account(
            token_id, &participant.address
        ), AccountData {
            amount: purchase_amount,
            vesting_schedules: vec![
                (
                    VestingSource::Sale(sale_id),
                    Token::<T>::token_info_by_id(token_id)
                        .last_sale
                        .unwrap()
                        .get_vesting_schedule(purchase_amount)
                )
            ].iter().cloned().collect(),
            split_staking_status: None
        });
        assert_last_event::<T>(
            RawEvent::TokensPurchasedOnSale(
                token_id,
                sale_id,
                purchase_amount,
                participant.address
            ).into()
        );
    }

    // Worst case scenario:
    // - New account needs to be created
    purchase_tokens_on_sale_without_proof {
        let purchase_amount: <T as Trait>::Balance = 100u32.into();
        let issuance: <T as Trait>::Balance = 1_000_000_000u32.into();
        let participant = account::<T::AccountId>("participant", 0, SEED);
        T::ReserveCurrency::deposit_creating(&participant, T::BloatBond::get());

        // Issue token and initialize sale
        let token_id = issue_token::<T>(issuance, TransferPolicyOf::<T>::Permissionless)?;
        let sale_id = init_token_sale::<T>(token_id, issuance, None)?;
    }: purchase_tokens_on_sale(
        RawOrigin::Signed(participant.clone()),
        token_id,
        purchase_amount,
        None
    )
    verify {
        assert_eq!(Token::<T>::account_info_by_token_and_account(
            token_id, &participant
        ), AccountData {
            amount: purchase_amount,
            vesting_schedules: vec![
                (
                    VestingSource::Sale(sale_id),
                    Token::<T>::token_info_by_id(token_id)
                        .last_sale
                        .unwrap()
                        .get_vesting_schedule(purchase_amount)
                )
            ].iter().cloned().collect(),
            split_staking_status: None
        });
        assert_last_event::<T>(
            RawEvent::TokensPurchasedOnSale(
                token_id,
                sale_id,
                purchase_amount,
                participant
            ).into()
        );
    }

    recover_unsold_tokens {
        let issuance = 1_000_000_000u32.into();
        let owner = token_owner_account::<T>();

        // Issue token and initialize sale
        let token_id = issue_token::<T>(issuance, TransferPolicyOf::<T>::Permissionless)?;
        let sale_id = init_token_sale::<T>(token_id, issuance, None)?;
        frame_system::Module::<T>::set_block_number(
            frame_system::Module::<T>::block_number().saturating_add(DEFAULT_SALE_DURATION.into())
        );
    }: _(
        RawOrigin::Signed(owner.clone()),
        token_id
    )
    verify {
        assert_eq!(
            Token::<T>::account_info_by_token_and_account(token_id, &owner).amount,
            issuance
        );
        assert_last_event::<T>(
            RawEvent::UnsoldTokensRecovered(
                token_id,
                sale_id,
                issuance
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
    fn test_purchase_tokens_on_sale_with_proof() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_purchase_tokens_on_sale_with_proof::<Test>());
        });
    }

    #[test]
    fn test_purchase_tokens_on_sale_without_proof() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_purchase_tokens_on_sale_without_proof::<Test>());
        });
    }

    #[test]
    fn test_recover_unsold_tokens() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(test_benchmark_recover_unsold_tokens::<Test>());
        });
    }
}
