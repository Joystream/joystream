pub mod from_serialized;

// Not exported - only here as sample code
// mod from_encoded;

use node_runtime::forum::InputValidationLengthConstraint;

pub fn new_validation(min: u16, max_min_diff: u16) -> InputValidationLengthConstraint {
    return InputValidationLengthConstraint { min, max_min_diff };
}
