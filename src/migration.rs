// Copyright 2019 Joystream Contributors
// This file is part of Joystream runtime

// Joystream runtime is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Joystream runtime is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// === Substrate ===
// Copyright 2017-2019 Parity Technologies (UK) Ltd.
// Substrate is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Substrate is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this software If not, see <http://www.gnu.org/licenses/>.

use crate::membership::members;
use crate::roles::actors;
use crate::VERSION;
use runtime_io::print;
use srml_support::{decl_event, decl_module, decl_storage, StorageValue};
use system;

// When preparing a new major runtime release version bump this value to match it and update
// the initialization code in runtime_initialization(). Because of the way substrate runs runtime code
// the runtime doesn't need to maintain any logic for old migrations. All knowledge about state of the chain and runtime
// prior to the new runtime taking over is implicit in the migration code implementation. If assumptions are incorrect
// behaviour is undefined.
const MIGRATION_FOR_SPEC_VERSION: u32 = 2;

impl<T: Trait> Module<T> {
    fn runtime_initialization() {
        if VERSION.spec_version != MIGRATION_FOR_SPEC_VERSION {
            return;
        }

        print("running runtime initializers");

        // ...
        // add initialization of other modules introduced in this runtime
        // ...

        Self::deposit_event(RawEvent::Migrated(
            <system::Module<T>>::block_number(),
            VERSION.spec_version,
        ));
    }
}

pub trait Trait: system::Trait + members::Trait + actors::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Migration {
        /// Records at what runtime spec version the store was initialized. This allows the runtime
        /// to know when to run initialize code if it was installed as an update.
        pub SpecVersion get(spec_version) build(|_| VERSION.spec_version) : Option<u32>;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        Migrated(BlockNumber, u32),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_initialize(_now: T::BlockNumber) {
            if Self::spec_version().map_or(true, |spec_version| VERSION.spec_version > spec_version) {
                // mark store version with current version of the runtime
                <SpecVersion<T>>::put(VERSION.spec_version);

                // run migrations and store initializers
                Self::runtime_initialization();
            }
        }
    }
}
