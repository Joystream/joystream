use governance::{council, election};
use runtime_io::print;

pub trait Trait: system::Trait + council::Trait + election::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Gov {

    }
}

/// Event for this module.
decl_event!(
	pub enum Event<T> where <T as system::Trait>::BlockNumber {
        ElectionStarted(BlockNumber),
	}
);

impl<T: Trait> Module<T> {

}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_finalise(n: T::BlockNumber) {
            if <election::Module<T>>::start_election().is_ok() {
                print("Election Started");
                Self::deposit_event(RawEvent::ElectionStarted(n));
            }
        }
    }
}