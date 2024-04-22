#![allow(clippy::unused_unit)]

use frame_support::decl_event;

use crate::{RemoteAccount, RemoteTransfer, TransferId};

use crate::types::*;

// Balance type alias
type BalanceOf<T> = <T as balances::Config>::Balance;

decl_event!(
    pub enum Event<T>
    where
        AccountId = <T as frame_system::Config>::AccountId,
        Balance = BalanceOf<T>,
        BridgeConstraints = BridgeConstraintsOf<T>,
    {
        OutboundTransferRequested(TransferId, AccountId, RemoteAccount, Balance, Balance),
        InboundTransferFinalized(RemoteTransfer, AccountId, Balance),
        BridgePaused(AccountId),
        BridgeThawnStarted(AccountId),
        BridgeThawnFinished(),
        BridgeConfigUpdated(BridgeConstraints),
    }
);
