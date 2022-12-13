use node_runtime::{constants::currency, DataObjectBloatBond, StorageConfig};

pub fn production_config() -> StorageConfig {
    StorageConfig {
        data_object_per_mega_byte_fee: 5 * currency::MILLICENTS,
        data_object_state_bloat_bond_value: DataObjectBloatBond::get(),
    }
}

pub fn testing_config() -> StorageConfig {
    StorageConfig {
        data_object_per_mega_byte_fee: 5 * currency::MILLICENTS,
        data_object_state_bloat_bond_value: DataObjectBloatBond::get(),
    }
}
