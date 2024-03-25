use codec::Encode;

use sp_runtime::generic;
use sp_runtime::generic::SignedPayload;
use sp_runtime::SaturatedConversion;

use crate::{AccountId, BlockHashCount, Index, SignedExtra, UncheckedExtrinsic};
use crate::{Runtime, RuntimeCall, System};
use log;

/// 'Create transaction' default implementation.
pub(crate) fn create_transaction<
    C: frame_system::offchain::AppCrypto<
        <Runtime as frame_system::offchain::SigningTypes>::Public,
        <Runtime as frame_system::offchain::SigningTypes>::Signature,
    >,
>(
    call: RuntimeCall,
    public: <<Runtime as frame_system::offchain::SigningTypes>::Signature as sp_runtime::traits::Verify>::Signer,
    account: AccountId,
    nonce: Index,
) -> Option<(
    RuntimeCall,
    <UncheckedExtrinsic as sp_runtime::traits::Extrinsic>::SignaturePayload,
)> {
    // take the biggest period possible.
    let period = BlockHashCount::get()
        .checked_next_power_of_two()
        .map(|c| c / 2)
        .unwrap_or(2) as u64;
    let current_block = System::block_number()
        .saturated_into::<u64>()
        // The `frame_system::block_number` is initialized with `n+1`,
        // so the actual block number is `n`.
        .saturating_sub(1);
    let tip = 0;
    let extra: SignedExtra = (
        frame_system::CheckNonZeroSender::<Runtime>::new(),
        frame_system::CheckSpecVersion::<Runtime>::new(),
        frame_system::CheckTxVersion::<Runtime>::new(),
        frame_system::CheckGenesis::<Runtime>::new(),
        frame_system::CheckEra::<Runtime>::from(generic::Era::mortal(period, current_block)),
        frame_system::CheckNonce::<Runtime>::from(nonce),
        frame_system::CheckWeight::<Runtime>::new(),
        pallet_transaction_payment::ChargeTransactionPayment::<Runtime>::from(tip),
    );
    let raw_payload = SignedPayload::new(call, extra)
        .map_err(|e| {
            log::warn!("Unable to create signed payload: {:?}", e);
        })
        .ok()?;
    let signature = raw_payload.using_encoded(|payload| C::sign(payload, public))?;
    let (call, extra, _) = raw_payload.deconstruct();
    Some((call, (account, signature, extra)))
}
