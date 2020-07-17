use super::*;
use runtime_primitives::traits::Hash;

impl<T: Trait> From<InputPropertyValue<T>> for OutputPropertyValue<T> {
    fn from(input_property_value: InputPropertyValue<T>) -> Self {
        match input_property_value {
            InputPropertyValue::Single(single_input_property_value) => {
                OutputPropertyValue::Single(single_input_property_value.into())
            }
            InputPropertyValue::Vector(vector_input_property_value) => {
                OutputPropertyValue::Vector(vector_input_property_value.into())
            }
        }
    }
}

impl<T: Trait> From<SingleInputPropertyValue<T>> for SingleOutputPropertyValue<T> {
    fn from(single_input_property_value: SingleInputPropertyValue<T>) -> Self {
        SingleOutputPropertyValue::new(single_input_property_value.get_value().into())
    }
}

impl<T: Trait> From<VecInputPropertyValue<T>> for VecOutputPropertyValue<T> {
    fn from(vec_input_property_value: VecInputPropertyValue<T>) -> Self {
        let (vec_value, nonce) = vec_input_property_value.unzip();

        VecOutputPropertyValue::new(vec_value.into(), nonce)
    }
}

impl<T: Trait> From<InputValue<T>> for OutputValue<T> {
    fn from(input_value: InputValue<T>) -> Self {
        match input_value {
            InputValue::Bool(value) => OutputValue::Bool(value),
            InputValue::Uint16(value) => OutputValue::Uint16(value),
            InputValue::Uint32(value) => OutputValue::Uint32(value),
            InputValue::Uint64(value) => OutputValue::Uint64(value),
            InputValue::Int16(value) => OutputValue::Int16(value),
            InputValue::Int32(value) => OutputValue::Int32(value),
            InputValue::Int64(value) => OutputValue::Int64(value),
            InputValue::Text(value) => OutputValue::Text(value),

            InputValue::TextToHash(value) => {
                let hash_value = value.using_encoded(<T as system::Trait>::Hashing::hash);
                OutputValue::Hash(hash_value)
            }
            InputValue::Reference(value) => OutputValue::Reference(value),
        }
    }
}

impl<T: Trait> From<VecInputValue<T>> for VecOutputValue<T> {
    fn from(vec_input_value: VecInputValue<T>) -> Self {
        match vec_input_value {
            VecInputValue::Bool(vec_value) => VecOutputValue::Bool(vec_value),
            VecInputValue::Uint16(vec_value) => VecOutputValue::Uint16(vec_value),
            VecInputValue::Uint32(vec_value) => VecOutputValue::Uint32(vec_value),
            VecInputValue::Uint64(vec_value) => VecOutputValue::Uint64(vec_value),
            VecInputValue::Int16(vec_value) => VecOutputValue::Int16(vec_value),
            VecInputValue::Int32(vec_value) => VecOutputValue::Int32(vec_value),
            VecInputValue::Int64(vec_value) => VecOutputValue::Int64(vec_value),
            VecInputValue::Text(vec_value) => VecOutputValue::Text(vec_value),

            VecInputValue::TextToHash(vec_value) => {
                let hash_vec_value: Vec<_> = vec_value
                    .into_iter()
                    .map(|value| value.using_encoded(<T as system::Trait>::Hashing::hash))
                    .collect();
                VecOutputValue::Hash(hash_vec_value)
            }
            VecInputValue::Reference(value) => VecOutputValue::Reference(value),
        }
    }
}
