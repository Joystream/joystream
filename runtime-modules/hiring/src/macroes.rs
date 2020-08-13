/// TODO: Move into Substrate-utility library
/// Ensure that two expressions are equal.
macro_rules! ensure_eq {
    ($left:expr, $right:expr, $error:expr) => {
        ensure!(($left) == ($right), $error)
    };
}

/// TODO: Move into Substrate-utility library
/// Ensure that a storage map, with a given name, has mapping for the given key value.
macro_rules! ensure_map_key {
    ($map_variable_name:ident , $runtime_trait:tt, $key:expr, $error:expr) => {{
        if <$map_variable_name<$runtime_trait>>::contains_key($key) {
            let value = <$map_variable_name<$runtime_trait>>::get($key);

            Ok(value)
        } else {
            Err($error)
        }
    }};
}

/// Ensure that an opening exists in `OpeningnById`, and if so, return it.
///
/// Returns
/// - `Ok(opening)` where `opening` is the opening, if it exists.
/// - `Err($error)` otherwise
macro_rules! ensure_opening_exists {
    ($runtime_trait:tt, $opening_id:expr, $error:expr) => {{
        ensure_map_key!(OpeningById, $runtime_trait, $opening_id, $error)
    }};
}

/// Ensure that an applications exists in `ApplicationById` , and if so, return it along with the
/// corresponding opening.
macro_rules! ensure_application_exists {
    ($runtime_trait:tt, $application_id:expr, $error:expr) => {{
        ensure_map_key!(ApplicationById, $runtime_trait, $application_id, $error)
    }};

    ($runtime_trait:tt, $application_id:expr, $error:expr, auto_fetch_opening) => {{
        ensure_application_exists!($runtime_trait, $application_id, $error).and_then(
            |application| {
                // Grab corresponding opening, which MUST exist.
                let opening = <OpeningById<$runtime_trait>>::get(application.opening_id);

                // Return both
                Ok((application, opening))
            },
        )
    }};
}

/// Ensures that an opening is active.
macro_rules! ensure_opening_is_active {
    ($stage:expr, $error:expr) => {{
        match $stage {
            hiring::OpeningStage::Active {
                // <= need proper type here in the future, not param
                ref stage,
                ref applications_added,
                ref active_application_count,
                ref unstaking_application_count,
                ref deactivated_application_count,
            } => Ok((
                stage.clone(),
                applications_added.clone(),
                active_application_count.clone(),
                unstaking_application_count.clone(),
                deactivated_application_count.clone(),
            )),
            _ => Err($error),
        }
    }};
}

/// Ensures that active opening stage is accepting applications.
macro_rules! ensure_active_opening_is_accepting_applications {

    ($stage:expr, $error:expr) => {{

        match $stage {
            hiring::ActiveOpeningStage::AcceptingApplications {
                started_accepting_applicants_at_block
            } => Ok(started_accepting_applicants_at_block), // <= need proper type here in the future, not param
            _ => Err($error),
        }
    }}
}

/// Ensures that optional imbalance matches requirements of optional staking policy
macro_rules! ensure_stake_balance_matches_staking_policy {
    (
        $opt_balance:expr,
        $opt_policy: expr,
        $stake_missing_when_required_error:expr,
        $stake_provided_when_redundant_error:expr,
        $stake_amount_too_low_error:expr

    ) => {{
        if let Some(ref balance) = $opt_balance {
            if let Some(ref policy) = $opt_policy {
                if !policy.accepts_amount(balance) {
                    Err($stake_amount_too_low_error)
                } else {
                    Ok(Some(balance.clone()))
                }
            } else {
                Err($stake_provided_when_redundant_error)
            }
        } else if $opt_policy.is_some() {
            Err($stake_missing_when_required_error)
        } else {
            Ok(None)
        }
    }};
}

/// Ensures that an optional unstaking period is at least one block whens set.
macro_rules! _ensure_opt_unstaking_period_not_zero {
    ($opt_period:expr, $error:expr) => {{
        if let Some(ref length) = $opt_period {
            let lower_bound = One::one();

            if *length < lower_bound {
                Err($error)
            } else {
                Ok(())
            }
        } else {
            Ok(())
        }
    }};
}

/// Ensures that provided unstaking period is not redundant
macro_rules! _ensure_opt_unstaking_period_not_redundant {
    (
        $opt_policy:expr,
        $opt_staking_period:expr,
        $error:expr
    ) => {{
        if $opt_policy.is_some() || $opt_staking_period.is_none() {
            Ok(())
        } else {
            Err($error)
        }
    }};
}

/// Ensures that provided unstaking period is valid
macro_rules! ensure_opt_unstaking_period_is_ok {
    (
        $opt_staking_period:expr,
        $opt_staking_policy:expr,
        $period_zero_error:expr,
        $period_redundant_error:expr
    ) => {{
        _ensure_opt_unstaking_period_not_zero!($opt_staking_period, $period_zero_error).and(
            _ensure_opt_unstaking_period_not_redundant!(
                $opt_staking_policy,
                $opt_staking_period,
                $period_redundant_error
            ),
        )
    }};
}

/// Ensures that a new application would make it into a given opening
macro_rules! ensure_application_would_get_added {
    (
        $opt_staking_policy:expr,
        $applicants:expr,
        $opt_role_stake_balance:expr,
        $opt_application_stake_balance:expr,
        $error:expr) => {{
        match Self::would_application_get_added(
            $opt_staking_policy,
            $applicants,
            $opt_role_stake_balance,
            $opt_application_stake_balance,
        ) {
            // Would get added indeed!
            ApplicationWouldGetAddedEvaluation::Yes(success) => Ok(success),
            _ => Err($error),
        }
    }};
}
