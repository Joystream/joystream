#![warn(missing_docs)]

use crate::Runtime;
use governance::election::CouncilElected;

/// 'Council elected' event handler. Should be applied to the 'election' substrate module.
/// CouncilEvent is handled by resetting active proposals.
pub struct CouncilElectedHandler;

impl<Elected, Term> CouncilElected<Elected, Term> for CouncilElectedHandler {
    fn council_elected(_new_council: Elected, _term: Term) {
        <proposals_engine::Module<Runtime>>::reset_active_proposals();
    }
}
