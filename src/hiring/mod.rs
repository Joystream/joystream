mod application;
mod opening;
mod staking_policy;

pub use application::*;
pub use opening::*;
pub use staking_policy::*;

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum StakePurpose {
    Role,
    Application,
}
