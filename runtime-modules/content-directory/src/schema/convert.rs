use super::*;
use sp_runtime::traits::Hash;

impl<
        Hashing: Hash<Output = HashType>,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
        Nonce: Default,
    > From<InputPropertyValue<Hashing, HashType, EntityId>>
    for StoredPropertyValue<Nonce, HashType, EntityId>
{
    fn from(input_property_value: InputPropertyValue<Hashing, HashType, EntityId>) -> Self {
        match input_property_value {
            InputPropertyValue::Single(input_value) => {
                StoredPropertyValue::Single(input_value.into())
            }
            InputPropertyValue::Vector(vector_input_value) => {
                let vec_output_property_value =
                    VecStoredPropertyValue::new(vector_input_value.into(), Nonce::default());
                StoredPropertyValue::Vector(vec_output_property_value)
            }
        }
    }
}

impl<
        Hashing: Hash<Output = HashType>,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > From<InputValue<Hashing, HashType, EntityId>> for StoredValue<HashType, EntityId>
{
    fn from(input_value: InputValue<Hashing, HashType, EntityId>) -> Self {
        match input_value {
            InputValue::Bool(value) => StoredValue::Bool(value),
            InputValue::Uint16(value) => StoredValue::Uint16(value),
            InputValue::Uint32(value) => StoredValue::Uint32(value),
            InputValue::Uint64(value) => StoredValue::Uint64(value),
            InputValue::Int16(value) => StoredValue::Int16(value),
            InputValue::Int32(value) => StoredValue::Int32(value),
            InputValue::Int64(value) => StoredValue::Int64(value),
            InputValue::Text(value) => StoredValue::Text(value),

            InputValue::TextToHash(value) => {
                let hash_value = value.using_encoded(Hashing::hash);
                StoredValue::Hash(hash_value)
            }
            InputValue::Reference(value) => StoredValue::Reference(value),
        }
    }
}

impl<
        Hashing: Hash<Output = HashType>,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > From<VecInputValue<Hashing, HashType, EntityId>> for VecStoredValue<HashType, EntityId>
{
    fn from(vec_input_value: VecInputValue<Hashing, HashType, EntityId>) -> Self {
        match vec_input_value {
            VecInputValue::Bool(vec_value) => VecStoredValue::Bool(vec_value),
            VecInputValue::Uint16(vec_value) => VecStoredValue::Uint16(vec_value),
            VecInputValue::Uint32(vec_value) => VecStoredValue::Uint32(vec_value),
            VecInputValue::Uint64(vec_value) => VecStoredValue::Uint64(vec_value),
            VecInputValue::Int16(vec_value) => VecStoredValue::Int16(vec_value),
            VecInputValue::Int32(vec_value) => VecStoredValue::Int32(vec_value),
            VecInputValue::Int64(vec_value) => VecStoredValue::Int64(vec_value),
            VecInputValue::Text(vec_value) => VecStoredValue::Text(vec_value),

            VecInputValue::TextToHash(vec_value) => {
                let hash_vec_value: Vec<_> = vec_value
                    .into_iter()
                    .map(|value| value.using_encoded(Hashing::hash))
                    .collect();
                VecStoredValue::Hash(hash_vec_value)
            }
            VecInputValue::Reference(value) => VecStoredValue::Reference(value),
        }
    }
}
