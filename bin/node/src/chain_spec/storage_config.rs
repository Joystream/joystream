use node_runtime::{constants::currency, StorageConfig};

pub fn production_config() -> StorageConfig {
    StorageConfig {
        data_object_per_mega_byte_fee: currency::MILLICENTS,
        data_object_state_bloat_bond_value: 10 * currency::MILLICENTS,
    }
}

pub fn testing_config() -> StorageConfig {
    StorageConfig {
        data_object_per_mega_byte_fee: currency::MILLICENTS,
        data_object_state_bloat_bond_value: 10 * currency::MILLICENTS,
    }
}
