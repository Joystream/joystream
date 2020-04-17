// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

mod types;
mod constraints;

use system;
use srml_support::{decl_module, decl_storage, dispatch};
use rstd::collections::btree_set::BTreeSet;
use sr_primitives::traits::{One, }; // Member, SimpleArithmetic, MaybeSerialize, Zero
use srml_support::traits::Currency;

use types::{OpeningPolicyCommitment, CuratorOpening};
use constraints::InputValidationLengthConstraint;


pub static MSG_CHANNEL_DESCRIPTION_TOO_SHORT: &str = "Channel description too short";
pub static MSG_CHANNEL_DESCRIPTION_TOO_LONG: &str = "Channel description too long";

/// Type for the identifer for an opening for a curator.
pub type CuratorOpeningId<T> = <T as hiring::Trait>::OpeningId;

/// Tyoe for the indentifier for an application as a curator.
pub type CuratorApplicationId<T> = <T as hiring::Trait>::ApplicationId;

/// Balance type of runtime
pub type BalanceOf<T> =
<<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;


pub trait Trait<I: Instance>: system::Trait + hiring::Trait{}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Bureaucracy {
        pub TestData get(test_data): u32;

        /// Next identifier valuefor new curator opening.
        pub NextCuratorOpeningId get(next_curator_opening_id): CuratorOpeningId<T>;

        /// Maps identifeir to curator opening.
        pub CuratorOpeningById get(curator_opening_by_id): linked_map CuratorOpeningId<T> => CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>>;

        pub OpeningHumanReadableText get(opening_human_readable_text): InputValidationLengthConstraint;
    }
}

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
        /// Add an opening for a curator role.
        pub fn add_curator_opening(origin, activate_at: hiring::ActivateOpeningAt<T::BlockNumber>, commitment: OpeningPolicyCommitment<T::BlockNumber, BalanceOf<T>>, human_readable_text: Vec<u8>)  {

            // Ensure lead is set and is origin signer
 //           Self::ensure_origin_is_set_lead(origin)?;

            // Ensure human radable text is valid
            Self::ensure_opening_human_readable_text_is_valid(&human_readable_text)?;

            // Add opening
            // NB: This call can in principle fail, because the staking policies
            // may not respect the minimum currency requirement.

            let policy_commitment = commitment.clone();

            // let opening_id = ensure_on_wrapped_error!(
            //     hiring::Module::<T>::add_opening(
            //         activate_at,
            //         commitment.max_review_period_length,
            //         commitment.application_rationing_policy,
            //         commitment.application_staking_policy,
            //         commitment.role_staking_policy,
            //         human_readable_text,
            //     ))?;

            let opening_id = hiring::Module::<T>::add_opening(
                activate_at,
                commitment.max_review_period_length,
                commitment.application_rationing_policy,
                commitment.application_staking_policy,
                commitment.role_staking_policy,
                human_readable_text,
            ).unwrap(); //TODO

            //
            // == MUTATION SAFE ==
            //

            let new_curator_opening_id = NextCuratorOpeningId::<T, I>::get();

            // Create and add curator opening.
            let new_opening_by_id = CuratorOpening::<CuratorOpeningId<T>, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>> {
                opening_id : opening_id,
                curator_applications: BTreeSet::new(),
                policy_commitment: policy_commitment
            };

            CuratorOpeningById::<T, I>::insert(new_curator_opening_id, new_opening_by_id);

            // Update NextCuratorOpeningId
            NextCuratorOpeningId::<T, I>::mutate(|id| *id += <CuratorOpeningId<T> as One>::one());

            // Trigger event
            //Self::deposit_event(RawEvent::CuratorOpeningAdded(new_curator_opening_id));
        }
    }
}


impl<T: Trait<I>, I: Instance> Module<T, I> {
    pub fn set_test_data(data : u32) {
        <TestData<I>>::put(data);
    }

    fn ensure_opening_human_readable_text_is_valid(text: &Vec<u8>) -> dispatch::Result {
        <OpeningHumanReadableText<I>>::get().ensure_valid(
            text.len(),
            MSG_CHANNEL_DESCRIPTION_TOO_SHORT,
            MSG_CHANNEL_DESCRIPTION_TOO_LONG,
        )
    }
}



#[cfg(test)]
mod test {

    use primitives::H256;
    use sr_primitives::{
        testing::Header,
        traits::{BlakeTwo256, IdentityLookup},
        Perbill,
    };
    use srml_support::{impl_outer_origin, parameter_types};

    use crate::{Module, Trait};

    impl_outer_origin! {
            pub enum Origin for Test {}
    }

    parameter_types! {
        pub const BlockHashCount: u64 = 250;
        pub const MaximumBlockWeight: u32 = 1024;
        pub const MaximumBlockLength: u32 = 2 * 1024;
        pub const AvailableBlockRatio: Perbill = Perbill::one();
        pub const MinimumPeriod: u64 = 5;
    }

    // Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
    #[derive(Clone, PartialEq, Eq, Debug)]
    pub struct Test;

    impl system::Trait for Test {
        type Origin = Origin;
        type Index = u64;
        type BlockNumber = u64;
        type Call = ();
        type Hash = H256;
        type Hashing = BlakeTwo256;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
        type Header = Header;
        type Event = ();
        type BlockHashCount = BlockHashCount;
        type MaximumBlockWeight = MaximumBlockWeight;
        type MaximumBlockLength = MaximumBlockLength;
        type AvailableBlockRatio = AvailableBlockRatio;
        type Version = ();
    }

    impl Trait<Instance1> for Test {}
    impl Trait<Instance2> for Test {}

    use crate::Instance1;
    use crate::Instance2;

    type Bureaucracy1 = Module<Test, Instance1>;
    type Bureaucracy2 = Module<Test, Instance2>;

    impl Trait<Instance15> for Test {}
    use crate::Instance15;
    type Bureaucracy16 = Module<Test, Instance15>;

	pub fn build_test_externalities() -> runtime_io::TestExternalities {
		let t = system::GenesisConfig::default()
			.build_storage::<Test>()
			.unwrap();

		t.into()
	}



	#[test]
    fn test_instances_storage_separation() {
        build_test_externalities().execute_with(|| {
            Bureaucracy1::set_test_data(10);

            assert_eq!(Bureaucracy1::test_data(), 10);
            assert_eq!(Bureaucracy2::test_data(), 10);
        });
	}
}
