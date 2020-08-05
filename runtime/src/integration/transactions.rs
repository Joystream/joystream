use codec::Encode;
use frame_support::debug;
use frame_support::weights::{WeightToFeeCoefficients, WeightToFeePolynomial};
use sp_runtime::generic;
use sp_runtime::generic::SignedPayload;
use sp_runtime::SaturatedConversion;

use crate::{AccountId, Balance, BlockHashCount, Index, SignedExtra, UncheckedExtrinsic};
use crate::{Call, Runtime, System};

/// Stub for zero transaction weights.
pub struct NoWeights;
impl WeightToFeePolynomial for NoWeights {
    type Balance = Balance;

    fn polynomial() -> WeightToFeeCoefficients<Self::Balance> {
        Default::default()
    }

    fn calc(_weight: &u64) -> Self::Balance {
        Default::default()
    }
}

/// 'Create transaction' default implementation.
pub(crate) fn create_transaction<
    C: system::offchain::AppCrypto<
        <Runtime as system::offchain::SigningTypes>::Public,
        <Runtime as system::offchain::SigningTypes>::Signature,
    >,
>(
    call: Call,
    public: <<Runtime as system::offchain::SigningTypes>::Signature as sp_runtime::traits::Verify>::Signer,
    account: AccountId,
    nonce: Index,
) -> Option<(
    Call,
    <UncheckedExtrinsic as sp_runtime::traits::Extrinsic>::SignaturePayload,
)> {
    // take the biggest period possible.
    let period = BlockHashCount::get()
        .checked_next_power_of_two()
        .map(|c| c / 2)
        .unwrap_or(2) as u64;
    let current_block = System::block_number()
        .saturated_into::<u64>()
        // The `System::block_number` is initialized with `n+1`,
        // so the actual block number is `n`.
        .saturating_sub(1);
    let tip = 0;
    let extra: SignedExtra = (
        system::CheckSpecVersion::<Runtime>::new(),
        system::CheckTxVersion::<Runtime>::new(),
        system::CheckGenesis::<Runtime>::new(),
        system::CheckEra::<Runtime>::from(generic::Era::mortal(period, current_block)),
        system::CheckNonce::<Runtime>::from(nonce),
        system::CheckWeight::<Runtime>::new(),
        pallet_transaction_payment::ChargeTransactionPayment::<Runtime>::from(tip),
        pallet_grandpa::ValidateEquivocationReport::<Runtime>::new(),
    );
    let raw_payload = SignedPayload::new(call, extra)
        .map_err(|e| {
            debug::warn!("Unable to create signed payload: {:?}", e);
        })
        .ok()?;
    let signature = raw_payload.using_encoded(|payload| C::sign(payload, public))?;
    let (call, extra, _) = raw_payload.deconstruct();
    Some((call, (account, signature, extra)))
}
