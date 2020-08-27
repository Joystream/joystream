// pub mod from_serialized;
pub mod from_encoded;

use node_runtime::common::constraints::InputValidationLengthConstraint;

pub fn new_validation(min: u16, max_min_diff: u16) -> InputValidationLengthConstraint {
    InputValidationLengthConstraint { min, max_min_diff }
}
