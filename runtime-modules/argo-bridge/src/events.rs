#![allow(clippy::unused_unit)]

use frame_support::decl_event;

use crate::{RemoteAccount, RemoteTransfer, TransferId};

use crate::types::*;

use frame_support::storage::bounded_vec::BoundedVec;
use frame_support::traits::ConstU32;

// Balance type alias
type BalanceOf<T> = <T as balances::Config>::Balance;

decl_event!(
    pub enum Event<T>
    where
        AccountId = <T as frame_system::Config>::AccountId,
        Balance = BalanceOf<T>,
        BridgeConstraints = BridgeConstraintsOf<T>,
        BlockNumber = <T as frame_system::Config>::BlockNumber,
    {
        OutboundTransferRequested(TransferId, AccountId, RemoteAccount, Balance, Balance),
        InboundTransferFinalized(RemoteTransfer, AccountId, Balance),
        OutboundTransferReverted(
            TransferId,
            AccountId,
            Balance,
            BoundedVec<u8, ConstU32<MAX_BYTES_RATIONALE>>,
        ),
        BridgePaused(AccountId),
        BridgeThawnStarted(AccountId, BlockNumber),
        BridgeThawnFinished(),
        BridgeConfigUpdated(BridgeConstraints),
    }
);
