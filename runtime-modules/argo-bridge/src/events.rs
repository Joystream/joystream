#![allow(clippy::unused_unit)]

use frame_support::decl_event;

use crate::{RemoteAccount, RemoteTransfer, TransferId};
use sp_std::vec::Vec;

use crate::types::*;

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
        OutboundTransferReverted(TransferId, AccountId, Balance, Vec<u8>),
        BridgePaused(AccountId),
        BridgeThawnStarted(AccountId, BlockNumber),
        BridgeThawnFinished(),
        BridgeConfigUpdated(BridgeConstraints),
    }
);
