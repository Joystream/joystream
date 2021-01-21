# EVM integration to Joystream
This branch contains a prototype of Ethereum Virtual Machine integration to Joystream's Substrate-based project.

Pallet `content-directory-evm` contains examples of basic interaction with EVM initiated from the Substrate.
Substrate's `AccountId`'s are mapped to Eth addresses and vice versa.

Examples of transferring value via EVM (basic transaction without data), deploying the contract, and calling the contract
functions are present.

To support and expose Ethereum RPC, a new API must be introduced in `runtime/src/runtime_api.rs` in the same way
as it is in the Frontier example. Due to the difference between the Substrate version used in the current Joystream version
and the version used in the Frontier. The versions should be synchronized in theory (with some changes to Frontier),
but since we are pausing the work on EVM for now, this issue was not resolved yet. It may be resolved without any extra
work in the future when Joystream starts using the newer Substrate version.
https://github.com/paritytech/frontier/blob/fb76cd09c7b2fb59fd7bc0cd567de66839283305/template/runtime/src/lib.rs#L476
