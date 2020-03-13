// Copyright 2019 Joystream Contributors
// This file is part of Joystream node.

// Joystream node is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Joystream node is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Joystream node.  If not, see <http://www.gnu.org/licenses/>.

//! Substrate Node Template CLI library.

#![warn(missing_docs)]
#![warn(unused_extern_crates)]

mod chain_spec;
mod cli;
mod forum_config;
mod members_config;
mod service;

pub use substrate_cli::{error, IntoExit, VersionInfo};

fn main() {
    let version = VersionInfo {
        name: "Joystream Node",
        commit: env!("VERGEN_SHA_SHORT"),
        version: env!("CARGO_PKG_VERSION"),
        executable_name: "joystream-node",
        author: "Joystream",
        description: "Joystream substrate node",
        support_url: "https://www.joystream.org/",
    };

    if let Err(e) = cli::run(::std::env::args(), cli::Exit, version) {
        eprintln!("Fatal error: {}\n\n{:?}", e, e);
        std::process::exit(1)
    }
}
