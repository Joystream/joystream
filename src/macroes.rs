/// TODO: Move into Substrate-utility library
/// Ensure that two expressions are equal.
///
///
/// Returns ...
#[macro_export]
macro_rules! ensure_eq {
    ($left:expr, $right:expr, $error:expr) => {
        ensure!(($left) == ($right), $error)
    };
}

/// TODO: Move into Substrate-utility library
/// Ensure that a storage map, with a given name, has mapping for the given key value.
///
/// Returns ...
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

/// Ensure that an opening exists in `OpeningnById`, and if so, return it.
///
/// Returns
/// - `Ok(opening)` where `opening` is the opening, if it exists.
/// - `Err($error)` otherwise
#[macro_export]
macro_rules! ensure_opening_exists {
    ($runtime_trait:tt, $opening_id:expr, $error:expr) => {{
        ensure_map_has_mapping_with_key!(OpeningById, $runtime_trait, $opening_id, $error)
    }};
}

/*
 * Move this out later
 *

    ($runtime_trait:tt, $application_id:expr, $error:expr, auto_fetch_opening) => {{

        let application = ensure_map_has_mapping_with_key!(
            ApplicationById,
            $runtime_trait,
            $application_id,
            $error
        )?;

        // Grab corresponding opening, which MUST exist.
        let opening = <OpeningById<$runtime_trait>>::get(application.opening_id);

        // Return both
        Ok((application, opening))
    }};
*/

/// Ensure that an applications exists in `ApplicationById` , and if so, return it along with the
/// corresponding opening.
///
/// Returns...
#[macro_export]
macro_rules! ensure_application_exists {
    ($runtime_trait:tt, $application_id:expr, $error:expr) => {{
        ensure_map_has_mapping_with_key!(ApplicationById, $runtime_trait, $application_id, $error)
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
///
/// Returns ...
#[macro_export]
macro_rules! ensure_opening_is_active {
    ($stage:expr, $error:expr) => {{
        match $stage {
            hiring::OpeningStage::Active {
                // <= need proper type here in the future, not param
                stage,
                applicants,
                active_application_count,
                unstaking_application_count,
                deactivated_application_count,
            } => Ok((
                stage,
                applicants,
                active_application_count,
                unstaking_application_count,
                deactivated_application_count,
            )),
            _ => Err($error),
        }
    }};
}

/// Ensures that an opening is waiting to begin.
///
/// Returns ...
#[macro_export]
macro_rules! ensure_opening_stage_is_waiting_to_begin {
    ($stage:expr, $error:expr) => {{
        match $stage {
            hiring::OpeningStage::WaitingToBegin {
                // <= need proper type here in the future, not param
                begins_at_block,
            } => Ok(begins_at_block),
            _ => Err($error),
        }
    }};
}

/*
//// FAILED ATTEMPT AT GENERLIZATION
/// Ensures that ....
///
/// Returns ...
#[macro_export]
macro_rules! ensure_is_variant {

    ($stage:expr, $variant_path:path, $error:expr, $( $x:expr ),*) => {{

        match $stage {

            $variant_path { $($x,)* } =>
                Ok(( $($x,)* ))
            ,
            _ => Err($error),
        }
    }}


}
*/

/// Ensures that active opening stage is accepting applications.
///
/// Returns ...
#[macro_export]
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

/// Ensures that active opening stage is in review period.
///
/// Returns ...
#[macro_export]
macro_rules! ensure_active_opening_is_in_review_period {
    ($stage:expr, $error:expr) => {{
        match $stage {
            hiring::ActiveOpeningStage::ReviewPeriod {
                started_accepting_applicants_at_block,
                started_review_period_at_block,
            } => Ok((
                started_accepting_applicants_at_block,
                started_review_period_at_block,
            )), // <= need proper type here in the future, not param
            _ => Err($error),
        }
    }};
}

/// Ensures that optional imbalance matches requirements of optional staking policy
///
/// Returns ...
#[macro_export]
macro_rules! ensure_stake_imbalance_matches_staking_policy {
    (
        $opt_imbalance:expr,
        $opt_policy: expr,
        $stake_missing_when_required_error:expr,
        $stake_provided_when_redundant_error:expr,
        $stake_amount_too_low_error:expr

    ) => {{
        if let Some(ref imbalance) = $opt_imbalance {
            if let Some(ref policy) = $opt_policy {
                let imbalance_value = imbalance.peek();

                if !policy.accepts_amount(&imbalance_value) {
                    Err($stake_amount_too_low_error)
                } else {
                    Ok(Some(imbalance_value))
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
///
/// Returns ...
#[macro_export]
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

/// Ensures that ...
///
/// Returns ...
#[macro_export]
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

/// Ensures that ...
///
/// Returns ...
#[macro_export]
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

/// Ensures that optional staking policy prescribes value that clears minimum balance requirement of the `Currency` module.
///
/// Returns ...
#[macro_export]
macro_rules! ensure_amount_valid_in_opt_staking_policy {
    ($runtime_trait:tt, $opt_staking_policy:expr, $error:expr) => {{
        if let Some(ref staking_policy) = $opt_staking_policy {
            if staking_policy.amount < $runtime_trait::Currency::minimum_balance() {
                Err($error)
            } else {
                Ok(())
            }
        } else {
            Ok(())
        }
    }};
}

/// Ensures that a new application would make it into a given opening
///
/// Returns ...
#[macro_export]
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
