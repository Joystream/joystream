use node_runtime::{argo_bridge::types::BridgeStatus, ArgoBridgeConfig};

pub fn production_config() -> ArgoBridgeConfig {
    ArgoBridgeConfig {
        status: BridgeStatus::Paused,
        mint_allowance: 0,
        bridging_fee: 0,
        thawn_duration: 1,
        ..Default::default()
    }
}

pub fn testing_config() -> ArgoBridgeConfig {
    ArgoBridgeConfig {
        status: BridgeStatus::Paused,
        mint_allowance: 0,
        bridging_fee: 0,
        thawn_duration: 1,
        ..Default::default()
    }
}
