// Copyright 2019-2020 Parity Technologies (UK) Ltd.
// This file is part of Substrate.

// Substrate is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Substrate is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Substrate.  If not, see <http://www.gnu.org/licenses/>.

use clap::Parser;
use rand::{distributions::Alphanumeric, rngs::OsRng, Rng};

use std::{
    path::{Path, PathBuf},
    sync::Arc,
};

use joystream_node::chain_spec::{
    self, session_keys, AuthorityDiscoveryId, BabeId, GrandpaId, ImOnlineId, JOY_ADDRESS_PREFIX,
};

use sc_keystore::LocalKeystore;
use sp_core::crypto::{ByteArray, Ss58AddressFormat};
use sp_keystore::{SyncCryptoStore, SyncCryptoStorePtr};

/// A utility to easily create session keys from a seed, generate
/// new keys from a random seed or inspect public keys in existing keystore.
#[derive(Parser)]
#[clap(rename_all = "kebab-case")]
enum SessionKeysUtil {
    /// Create new session keys from a seed.
    /// Public keys will be output on stdout.
    FromSeed {
        /// Authority key seed.
        #[clap(long, short, required = true)]
        seed: String,
        /// The path where the keys should be saved.
        #[clap(long, short, default_value = "./keystore")]
        keystore_path: PathBuf,
    },
    /// Generate new random session keys, seed will be output on stderr,
    /// public keys will be output on stdout.
    Generate {
        /// The path where the keys should be saved.
        #[clap(long, short, default_value = "./keystore")]
        keystore_path: PathBuf,
    },
    /// Inspect keys from keystore
    Inspect {
        /// The path where the keys are stored.
        #[clap(long, short, default_value = "./keystore")]
        keystore_path: PathBuf,
        /// The output format, json or list (comma separatd list of the accoutns
        /// in order grandpa,babe,im_online,authority_discovery)
        #[clap(long, short, default_value = "list")]
        output: String,
    },
}

fn generate_session_keys_and_store(seed: &str, keystore_path: &Path) -> Result<(), String> {
    // Do not add more than one set of keys in the same keystore
    if keystore_path.is_dir() {
        return Err("Keystore already exists".into());
    }

    let keystore: SyncCryptoStorePtr =
        Arc::new(LocalKeystore::open(keystore_path, None).map_err(|err| err.to_string())?);

    let (_, _, grandpa, babe, im_online, authority_discovery) =
        chain_spec::authority_keys_from_seed(seed);

    let insert_key = |key_type, public| {
        SyncCryptoStore::insert_unknown(&*keystore, key_type, seed, public)
            .map_err(|_| format!("Failed to insert key: {:?}", key_type))
    };

    insert_key(sp_core::crypto::key_types::BABE, babe.as_slice())?;

    insert_key(sp_core::crypto::key_types::GRANDPA, grandpa.as_slice())?;

    insert_key(sp_core::crypto::key_types::IM_ONLINE, im_online.as_slice())?;

    insert_key(
        sp_core::crypto::key_types::AUTHORITY_DISCOVERY,
        authority_discovery.as_slice(),
    )?;

    // print public keys to stdout
    let keys = session_keys(grandpa, babe, im_online, authority_discovery);
    let serialized = serde_json::to_string_pretty(&keys).map_err(|err| err.to_string())?;
    println!("{}", serialized);

    Ok(())
}

fn inspect_keystore(keystore_path: &Path, output: String) -> Result<(), String> {
    if !keystore_path.is_dir() {
        return Err("Keystore does not exist".into());
    }

    let keystore: SyncCryptoStorePtr =
        Arc::new(LocalKeystore::open(keystore_path, None).map_err(|err| err.to_string())?);

    let grandpa_keys =
        SyncCryptoStore::keys(keystore.as_ref(), sp_core::crypto::key_types::GRANDPA)
            .map_err(|err| err.to_string())?;
    let babe_keys = SyncCryptoStore::keys(keystore.as_ref(), sp_core::crypto::key_types::BABE)
        .map_err(|err| err.to_string())?;
    let im_online_keys =
        SyncCryptoStore::keys(keystore.as_ref(), sp_core::crypto::key_types::IM_ONLINE)
            .map_err(|err| err.to_string())?;
    let authority_discovery_keys = SyncCryptoStore::keys(
        keystore.as_ref(),
        sp_core::crypto::key_types::AUTHORITY_DISCOVERY,
    )
    .map_err(|err| err.to_string())?;

    let grandpa = GrandpaId::from_slice(grandpa_keys[0].1.as_slice())
        .map_err(|_err| "failed to convert grandpa key")?;

    let babe = BabeId::from_slice(babe_keys[0].1.as_slice())
        .map_err(|_err| "failed to convert babe key")?;

    let im_online = ImOnlineId::from_slice(im_online_keys[0].1.as_slice())
        .map_err(|_err| "failed to convert im_online key")?;

    let authority_discovery =
        AuthorityDiscoveryId::from_slice(authority_discovery_keys[0].1.as_slice())
            .map_err(|_err| "failed to convert authority_discovery key")?;

    let keys = session_keys(grandpa, babe, im_online, authority_discovery);

    if output == "json" {
        let serialized = serde_json::to_string_pretty(&keys).map_err(|err| err.to_string())?;
        println!("{}", serialized);
    } else {
        println!(
            "{},{},{},{}",
            keys.grandpa, keys.babe, keys.im_online, keys.authority_discovery
        );
    }

    Ok(())
}

#[async_std::main]
async fn main() -> Result<(), String> {
    sp_core::crypto::set_default_ss58_version(Ss58AddressFormat::custom(JOY_ADDRESS_PREFIX));

    let sk = SessionKeysUtil::from_args();

    match sk {
        SessionKeysUtil::Generate { keystore_path, .. } => {
            let rand_seed = || -> String {
                let rand_str: String = OsRng
                    .sample_iter(&Alphanumeric)
                    .take(32)
                    .map(char::from)
                    .collect();
                format!("//{}", rand_str)
            };

            let seed = rand_seed();
            generate_session_keys_and_store(&seed, &keystore_path)?;
            eprintln!("{}", seed);
        }
        SessionKeysUtil::FromSeed {
            seed,
            keystore_path,
            ..
        } => {
            generate_session_keys_and_store(&seed, &keystore_path)?;
        }
        SessionKeysUtil::Inspect {
            keystore_path,
            output,
            ..
        } => {
            inspect_keystore(&keystore_path, output)?;
        }
    };

    Ok(())
}
