#[macro_export]
macro_rules! ensure_map_has_mapping_with_key {
    ($map_variable_name:ident , $runtime_trait:tt, $key:expr, $error:expr) => {{
        if <$map_variable_name<$runtime_trait>>::exists($key) {
            let value = <$map_variable_name<$runtime_trait>>::get($key);

            Ok(value)
        } else {
            Err($error)
        }
    }};
}

#[macro_export]
macro_rules! ensure_stake_exists {
    ($runtime_trait:tt, $stake_id:expr, $error:expr) => {{
        ensure_map_has_mapping_with_key!(Stakes, $runtime_trait, $stake_id, $error)
    }};
}
