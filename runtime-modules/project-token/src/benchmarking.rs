#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::types::*;
use crate::utils::{build_merkle_path_helper, generate_merkle_root_helper};
use crate::Module as Token;
use balances::Pallet as Balances;
use common::membership::MembershipTypes;
use frame_benchmarking::{account, benchmarks, Zero};
use frame_system::EventRecord;
use frame_system::Pallet as System;
use frame_system::RawOrigin;
use membership::{BuyMembershipParameters, Module as Members};
use pallet_timestamp::{self as timestamp};
use sp_runtime::{traits::Hash, Permill, SaturatedConversion};
use sp_std::{vec, vec::Vec};
use storage::BagId;

// ----- DEFAULTS

const SEED: u32 = 0;
const DEFAULT_TOKEN_ISSUANCE: u64 = 1_000_000;
// Transfers
const MAX_TX_OUTPUTS: u32 = 1024;
const DEFAULT_TX_AMOUNT: u32 = 100;
// Whitelist
const MAX_MERKLE_PROOF_HASHES: u32 = 10;
// Sales
const DEFAULT_TOKENS_ON_SALE: u32 = 100_000;
const DEFAULT_SALE_UNIT_PRICE: u32 = 2_000_000;
const DEFAULT_SALE_PURCHASE: u32 = 100;
// Revenue splits
const DEFAULT_SPLIT_REVENUE: u64 = 8_000_000;
const DEFAULT_REVENUE_SPLIT_RATE: Permill = Permill::from_percent(50);
const DEFAULT_SPLIT_ALLOCATION: u64 = 4_000_000; // DEFAULT_REVENUE_SPLIT_RATE * DEFAULT_SPLIT_REVENUE
const DEFAULT_SPLIT_PAYOUT: u64 = 2_000_000;
const DEFAULT_SPLIT_PARTICIPATION: u64 =
    DEFAULT_SPLIT_PAYOUT * DEFAULT_TOKEN_ISSUANCE / DEFAULT_SPLIT_ALLOCATION;

// Amm
const DEFAULT_AMM_AMOUNT: u32 = 1000;
const DEFAULT_AMM_jOY_AMOUNT: u32 = 50100;
// Patronage
const DEFAULT_PATRONAGE: YearlyRate = YearlyRate(Permill::from_percent(1));
// Metadata
const MAX_KILOBYTES_METADATA: u32 = 100;

// ----- HELPERS

fn token_owner_account<T: Config>() -> T::AccountId {
    account::<T::AccountId>("owner", 0, SEED)
}

fn default_split_duration<T: Config>() -> T::BlockNumber {
    MinRevenueSplitDuration::<T>::get() + T::BlockNumber::one()
}

fn default_sale_duration<T: Config>() -> T::BlockNumber {
    MinSaleDuration::<T>::get() + T::BlockNumber::one()
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

fn uniq_handle(base: &str, index: u32) -> Vec<u8> {
    let mut handle = base.as_bytes().to_vec();
    for i in 0..4 {
        handle.push(get_byte(index, i));
    }
    handle
}

fn create_member<T: Config>(
    account_id: &T::AccountId,
    handle: &[u8],
) -> <T as MembershipTypes>::MemberId {
    let member_id = Members::<T>::members_created();
    let _ = Balances::<T>::deposit_creating(
        account_id,
        T::JoyExistentialDeposit::get() + Members::<T>::membership_price(),
    );
    Members::<T>::buy_membership(
        RawOrigin::Signed(account_id.clone()).into(),
        BuyMembershipParameters {
            controller_account: account_id.clone(),
            root_account: account_id.clone(),
            handle: Some(handle.to_vec()),
            referrer_id: None,
            metadata: vec![],
        },
    )
    .unwrap();
    member_id
}

fn create_owner<T: Config>() -> (<T as MembershipTypes>::MemberId, T::AccountId) {
    let owner_account = token_owner_account::<T>();
    let owner_member_id = create_member::<T>(&owner_account, b"owner");
    (owner_member_id, owner_account)
}

fn issue_token<T: Config>(
    transfer_policy: TransferPolicyParamsOf<T>,
) -> Result<T::TokenId, DispatchError> {
    let bloat_bond = BloatBond::<T>::get();

    // top up owner JOY balance
    let _ = Joy::<T>::deposit_creating(&token_owner_account::<T>(), bloat_bond);

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
            symbol: <T as frame_system::Config>::Hashing::hash_of(b"CRT"),
            transfer_policy,
            patronage_rate: DEFAULT_PATRONAGE,
            revenue_split_rate: DEFAULT_REVENUE_SPLIT_RATE,
        },
        UploadContext {
            bag_id: BagId::<T>::default(),
            uploader_account: token_owner_account::<T>(),
        },
    )?;
    Ok(token_id)
}

fn init_token_sale<T: Config>(token_id: T::TokenId) -> Result<TokenSaleId, DispatchError> {
    let sale_id = Token::<T>::token_info_by_id(token_id).next_sale_id;
    Token::<T>::init_token_sale(
        token_id,
        T::MemberId::zero(),
        Some(token_owner_account::<T>()),
        false,
        TokenSaleParamsOf::<T> {
            unit_price: DEFAULT_SALE_UNIT_PRICE.into(),
            upper_bound_quantity: DEFAULT_TOKENS_ON_SALE.into(),
            starts_at: None,
            duration: default_sale_duration::<T>(),
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

fn activate_amm<T: Config>(token_id: T::TokenId, member_id: T::MemberId) -> DispatchResult {
    let params = AmmParams {
        slope: Permill::from_percent(10),
        intercept: Permill::from_percent(10),
    };
    Token::<T>::activate_amm(token_id, member_id, params)
}

fn call_buy_on_amm<T: Config>(
    token_id: T::TokenId,
    account_id: T::AccountId,
    member_id: T::MemberId,
    amount: TokenBalanceOf<T>,
) -> DispatchResult {
    Token::<T>::buy_on_amm(
        RawOrigin::Signed(account_id).into(),
        token_id,
        member_id,
        amount,
        None,
        None,
    )
}

fn issue_revenue_split<T: Config>(token_id: T::TokenId, forced_id: Option<u32>) -> DispatchResult {
    // top up owner JOY balance
    let _ = Joy::<T>::deposit_creating(
        &token_owner_account::<T>(),
        DEFAULT_SPLIT_REVENUE.saturated_into(),
    );

    if let Some(forced_id) = forced_id {
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.next_revenue_split_id = forced_id
        })
    }

    Token::<T>::issue_revenue_split(
        token_id,
        None,
        default_split_duration::<T>(),
        token_owner_account::<T>(),
        DEFAULT_SPLIT_REVENUE.saturated_into(),
    )?;

    // Slash the remaining balance
    let _ = Joy::<T>::slash(
        &token_owner_account::<T>(),
        (DEFAULT_SPLIT_REVENUE - DEFAULT_SPLIT_ALLOCATION).saturated_into(),
    );

    Ok(())
}

fn setup_account_with_max_number_of_locks<T: Config>(
    token_id: T::TokenId,
    member_id: &T::MemberId,
    usable_balance: Option<TokenBalanceOf<T>>,
) {
    AccountInfoByTokenAndMember::<T>::mutate(token_id, member_id, |a| {
        for i in 0u32..T::MaxVestingSchedulesPerAccountPerToken::get() {
            a.add_or_update_vesting_schedule::<T>(
                VestingSource::Sale(i),
                VestingSchedule {
                    linear_vesting_duration: 0u32.into(),
                    linear_vesting_start_block: u32::MAX.into(),
                    cliff_amount: TokenBalanceOf::<T>::one(),
                    post_cliff_total_amount: TokenBalanceOf::<T>::zero(),
                    burned_amount: TokenBalanceOf::<T>::zero(),
                },
                None,
            )
            .unwrap();
        }
        a.split_staking_status = Some(StakingStatus {
            split_id: 0u32,
            amount: TokenBalanceOf::<T>::one(),
        });
        a.increase_amount_by(TokenBalanceOf::<T>::one() + usable_balance.unwrap_or_default());
    });
}

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = frame_system::Pallet::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    assert!(
        !events.is_empty(),
        "If you are checking for last event there must be at least 1 event"
    );
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

// ----- BENCHMARKS

benchmarks! {
    where_clause {
        where T: Config
    }

    // Worst case scenario:
    // - source_accout.vesting_schedules.len() is T::MaxVestingSchedulesPerAccountPerToken
    // - source_account.split_staking_status is Some(_)
    // - destination accounts do not exist (need to be created)
    // - bloat_bond is non-zero
    transfer {
        let o in 1 .. MAX_TX_OUTPUTS;
        let m in 1 .. MAX_KILOBYTES_METADATA;

        let (owner_member_id, owner_account) = create_owner::<T>();
        let outputs = Transfers::<_, _>(
            (0..o)
            .map(|i| {
                let member_id = create_member::<T>(
                    &account::<T::AccountId>("dst", i, SEED),
                    &uniq_handle("dst_member", i)
                );
                (
                    member_id,
                    Payment::<<T as Config>::Balance> {
                        amount: DEFAULT_TX_AMOUNT.into()
                    }
                )
            })
            .collect()
        );
        let bloat_bond: JoyBalanceOf<T> = T::JoyExistentialDeposit::get();
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        setup_account_with_max_number_of_locks::<T>(token_id, &owner_member_id, None);
        BloatBond::<T>::set(bloat_bond);
        let _ = Joy::<T>::deposit_creating(
            &owner_account,
            bloat_bond * o.into()
        );
        let metadata = vec![0xf].repeat((m * 1000) as usize);
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        owner_member_id,
        token_id,
        outputs.clone(),
        metadata.clone()
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
                        .map(|(m, p)| (Validated::NonExisting(*m), ValidatedPayment::from(PaymentWithVesting::from(p.clone()))))
                        .collect()
                ),
                metadata
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
        let bloat_bond: JoyBalanceOf<T> = T::JoyExistentialDeposit::get();

        BloatBond::<T>::set(bloat_bond);
        // Issue token
        let commitment = <T as frame_system::Config>::Hashing::hash_of(b"commitment");
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
            owner_member_id,
            (DEFAULT_TOKEN_ISSUANCE).into()
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
        let member_id = create_member::<T>(&acc, b"whitelisted");
        let commitment = generate_merkle_root_helper::<T, _>(&whitelisted_members).pop().unwrap();
        let proof = MerkleProof::<<T as frame_system::Config>::Hashing>(
            build_merkle_path_helper::<T, _>(&whitelisted_members, 0)
        );
        let transfer_policy_params = TransferPolicyParamsOf::<T>::Permissioned(WhitelistParams {
            commitment,
            payload: None
        });
        let bloat_bond: JoyBalanceOf<T> = T::JoyExistentialDeposit::get();


        // Make sure that proof.0.len() is h
        assert_eq!(proof.0.len() as u32, h);

        let _ = Joy::<T>::deposit_creating(&acc, bloat_bond);
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
    // - sale.earnings_destination.is_some()
    purchase_tokens_on_sale {
        create_owner::<T>();
        let participant = account::<T::AccountId>("participant", 0, SEED);
        let member_id = create_member::<T>(&participant, b"participant");
        let bloat_bond: JoyBalanceOf<T> = T::JoyExistentialDeposit::get();
        let platform_fee = Permill::from_percent(10);

        let _ = Joy::<T>::deposit_creating(
            &participant,
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
        assert!(
            Token::<T>::account_info_by_token_and_member(token_id, &member_id)
            == AccountData {
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
                ].iter().cloned().collect::<BTreeMap<_, _>>().try_into().unwrap(),
                split_staking_status: None,
                last_sale_total_purchased_amount: Some((sale_id, DEFAULT_SALE_PURCHASE.into())),
                next_vesting_transfer_id: 0,
                bloat_bond: RepayableBloatBond::new(bloat_bond, None),
            }
        );
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

    // Worst case scenario:
    // - participant.vesting_schedules.len() is T::MaxVestingSchedulesPerAccountPerToken
    // - participant.split_staking_status is Some(_)
    // - dividend_amount/payout is non-zero
    participate_in_split {
        let (owner_member_id, owner_account) = create_owner::<T>();

        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;

        let participant_acc = account::<T::AccountId>("participant", 0, SEED);
        let participant_id = create_member::<T>(&participant_acc, b"participant");
        setup_account_with_max_number_of_locks::<T>(token_id, &participant_id, Some(DEFAULT_SPLIT_PARTICIPATION.into()));

        // Issue revenue split
        // Note: We need to force split_id==1, because
        // setup_account_with_max_number_of_locks will setup a staking_status with split_id == 0
        issue_revenue_split::<T>(token_id, Some(1))?;

        System::<T>::set_block_number(
            System::<T>::block_number().saturating_add(Token::<T>::min_revenue_split_time_to_start())
        );
    }: _(
        RawOrigin::Signed(participant_acc.clone()),
        token_id,
        participant_id,
        DEFAULT_SPLIT_PARTICIPATION.into()
    )
    verify {
        assert_eq!(
            Token::<T>::account_info_by_token_and_member(token_id, &participant_id).staked(),
            DEFAULT_SPLIT_PARTICIPATION.into()
        );
        assert_eq!(
            Joy::<T>::usable_balance(&participant_acc),
            T::JoyExistentialDeposit::get() + DEFAULT_SPLIT_PAYOUT.saturated_into()
        );
        assert_last_event::<T>(
            RawEvent::UserParticipatedInSplit(
                token_id,
                participant_id,
                DEFAULT_SPLIT_PARTICIPATION.into(),
                DEFAULT_SPLIT_PAYOUT.saturated_into(),
                1u32
            ).into()
        );
    }

    // Worst case scenario:
    // - participant.vesting_schedules.len() is T::MaxVestingSchedulesPerAccountPerToken
    // - participant.split_staking_status is Some(_)
    // - exiting current split
    // - current split is active, but no longer ongoing
    exit_revenue_split {
        let (owner_member_id, owner_account) = create_owner::<T>();

        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;

        let participant_acc = account::<T::AccountId>("participant", 0, SEED);
        let participant_id = create_member::<T>(&participant_acc, b"participant");
        setup_account_with_max_number_of_locks::<T>(token_id, &participant_id, Some(DEFAULT_SPLIT_PARTICIPATION.into()));

        // Issue revenue split
        // Note: We need to force split_id==1, because
        // setup_account_with_max_number_of_locks will setup a staking_status with split_id == 0
        issue_revenue_split::<T>(token_id, Some(1))?;
        System::<T>::set_block_number(
            System::<T>::block_number().saturating_add(Token::<T>::min_revenue_split_time_to_start())
        );
        // Participate in split
        Token::<T>::participate_in_split(
            RawOrigin::Signed(participant_acc.clone()).into(),
            token_id,
            participant_id,
            DEFAULT_SPLIT_PARTICIPATION.into(),
        )?;
        // Go to: Split end
        System::<T>::set_block_number(System::<T>::block_number() + default_split_duration::<T>());
    }: _(
        RawOrigin::Signed(participant_acc.clone()),
        token_id,
        participant_id
    )
    verify {
        assert!(Token::<T>::account_info_by_token_and_member(token_id, &participant_id).split_staking_status.is_none());
        assert_last_event::<T>(
            RawEvent::RevenueSplitLeft(
                token_id,
                participant_id,
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
        setup_account_with_max_number_of_locks::<T>(token_id, &owner_member_id, None);
        let amount_to_burn = Token::<T>::account_info_by_token_and_member(token_id, &owner_member_id).amount;
        let bloat_bond = BloatBond::<T>::get();
    }: _(
        RawOrigin::Signed(owner_account.clone()),
        token_id,
        owner_member_id,
        amount_to_burn
    )
    verify {
        assert_eq!(
            Token::<T>::ensure_account_data_exists(token_id, &owner_member_id).unwrap().amount,
            <T as Config>::Balance::zero()
        );
        assert_last_event::<T>(
            RawEvent::TokensBurned(
                token_id,
                owner_member_id,
                amount_to_burn
            ).into()
        );
    }

    buy_on_amm_with_account_creation {
        let (owner_member_id, owner_account) = create_owner::<T>();
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        let amount_to_buy = DEFAULT_AMM_AMOUNT.into();
        let deadline = <T as timestamp::Config>::Moment::from(100u32);
        let desired_price = DEFAULT_AMM_jOY_AMOUNT.into(); // computed using supply = 0  a = 10% and b = 10%
        let bloat_bond = BloatBond::<T>::get();
        let tx_fee_amount = Token::<T>::amm_buy_tx_fees().mul_floor(desired_price);
        let participant_acc = account::<T::AccountId>("participant", 0, SEED);
        let participant_id = create_member::<T>(&participant_acc, b"participant");
        let _ = Joy::<T>::deposit_creating(&participant_acc, desired_price + bloat_bond + tx_fee_amount);
        let slippage_tolerance = (Permill::from_percent(10), desired_price);
        pallet_timestamp::Pallet::<T>::set_timestamp(deadline);
        activate_amm::<T>(token_id, owner_member_id)?;
    }: buy_on_amm(
        RawOrigin::Signed(participant_acc.clone()),
        token_id,
        participant_id,
        amount_to_buy,
        Some(deadline),
        Some(slippage_tolerance)
    )
    verify {
        let provided_supply = Token::<T>::ensure_token_exists(token_id).unwrap().amm_curve.unwrap().provided_supply;
        assert_eq!(provided_supply, amount_to_buy);
        assert_eq!(
            Token::<T>::ensure_account_data_exists(token_id, &participant_id).unwrap().amount,
            amount_to_buy,
        );
        assert_eq!(
            Joy::<T>::usable_balance(&participant_acc),
            T::JoyExistentialDeposit::get()
        );
    }

    buy_on_amm_with_existing_account {
        let (owner_member_id, owner_account) = create_owner::<T>();
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        let amount_to_buy = DEFAULT_AMM_AMOUNT.into();
        let deadline = <T as timestamp::Config>::Moment::from(100u32);
        let desired_price = DEFAULT_AMM_jOY_AMOUNT.into(); // computed using supply = 0  a = 10% and b = 10%
        let bloat_bond = BloatBond::<T>::get();
        let tx_fee_amount = Token::<T>::amm_buy_tx_fees().mul_floor(desired_price);
        let participant_acc = account::<T::AccountId>("participant", 0, SEED);
        let participant_id = create_member::<T>(&participant_acc, b"participant");
        activate_amm::<T>(token_id, owner_member_id)?;
        let _ = Joy::<T>::deposit_creating(&participant_acc, desired_price + bloat_bond + tx_fee_amount);
        let slippage_tolerance = (Permill::from_percent(10), desired_price);
        pallet_timestamp::Pallet::<T>::set_timestamp(deadline);
    }: buy_on_amm(
        RawOrigin::Signed(participant_acc.clone()),
        token_id,
        participant_id,
        amount_to_buy,
        Some(deadline),
        Some(slippage_tolerance)
    )
    verify {
        let provided_supply = Token::<T>::ensure_token_exists(token_id).unwrap().amm_curve.unwrap().provided_supply;
        assert_eq!(provided_supply, amount_to_buy);
        assert_eq!(
            Token::<T>::ensure_account_data_exists(token_id, &participant_id).unwrap().amount,
            amount_to_buy,
        );
        assert_eq!(
            Joy::<T>::usable_balance(&participant_acc),
            T::JoyExistentialDeposit::get(),
        );
    }

    sell_on_amm {
        let (owner_member_id, owner_account) = create_owner::<T>();
        let token_id = issue_token::<T>(TransferPolicyParams::Permissionless)?;
        let amount = DEFAULT_AMM_AMOUNT.into();
        let deadline = <T as timestamp::Config>::Moment::from(100u32);
        let desired_price = DEFAULT_AMM_jOY_AMOUNT.into(); // computed using supply = 0  a = 10% and b = 10%
        let bloat_bond = BloatBond::<T>::get();
        let buy_tx_fee_amount = Token::<T>::amm_buy_tx_fees().mul_floor(desired_price);
        let sell_tx_fee_amount = Token::<T>::amm_sell_tx_fees().mul_floor(desired_price);
        let participant_acc = account::<T::AccountId>("participant", 0, SEED);
        let participant_id = create_member::<T>(&participant_acc, b"participant");
        let _ = Joy::<T>::deposit_creating(&participant_acc, desired_price + bloat_bond + buy_tx_fee_amount);
        let slippage_tolerance = (Permill::from_percent(10), desired_price);
        pallet_timestamp::Pallet::<T>::set_timestamp(deadline);
        activate_amm::<T>(token_id, owner_member_id)?;
        call_buy_on_amm::<T>(token_id, participant_acc.clone(), participant_id, amount)?;
    }:_ (
        RawOrigin::Signed(participant_acc.clone()),
        token_id,
        participant_id,
        amount,
        Some(deadline),
        Some(slippage_tolerance)
    )
    verify {
        let provided_supply = Token::<T>::ensure_token_exists(token_id).unwrap().amm_curve.unwrap().provided_supply;
        assert!(provided_supply.is_zero());
        assert!(
            Token::<T>::ensure_account_data_exists(token_id, &participant_id).unwrap().amount.is_zero(),
        );
        assert_eq!(
            Joy::<T>::usable_balance(&participant_acc),
            desired_price + T::JoyExistentialDeposit::get() - sell_tx_fee_amount,
        );
    }
}

#[cfg(test)]
mod tests {
    use crate::tests::mock::{build_test_externalities, GenesisConfigBuilder, Test};
    use frame_support::assert_ok;
    type Token = crate::Module<Test>;

    #[test]
    fn test_transfer() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_transfer());
        });
    }

    #[test]
    fn test_dust_account() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_dust_account());
        });
    }

    #[test]
    fn test_join_whitelist() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_join_whitelist());
        });
    }

    #[test]
    fn test_purchase_tokens_on_sale() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_purchase_tokens_on_sale());
        });
    }

    #[test]
    fn test_participate_in_split() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_participate_in_split());
        });
    }

    #[test]
    fn test_exit_revenue_split() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_exit_revenue_split());
        });
    }

    #[test]
    fn test_burn() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_burn());
        });
    }

    #[test]
    fn test_buy_on_amm_with_account_creation() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_buy_on_amm_with_account_creation());
        });
    }

    #[test]
    fn test_buy_on_amm_with_existing_account() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_buy_on_amm_with_existing_account());
        });
    }

    #[test]
    fn test_sell_on_amm() {
        build_test_externalities(GenesisConfigBuilder::new_empty().build()).execute_with(|| {
            assert_ok!(Token::test_benchmark_sell_on_amm());
        });
    }
}
