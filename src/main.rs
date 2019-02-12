//! Substrate Node Template CLI library.

#![warn(missing_docs)]
#![warn(unused_extern_crates)]

#[macro_use]
extern crate error_chain;
#[macro_use]
extern crate log;
#[macro_use]
extern crate substrate_network as network;
#[macro_use]
extern crate substrate_executor;
#[macro_use]
extern crate substrate_service;

mod chain_spec;
mod service;
mod cli;

pub use substrate_cli::{VersionInfo, IntoExit, error};

fn run() -> cli::error::Result<()> {
	let version = VersionInfo {
		name: "Joystream Node",
		commit: env!("VERGEN_SHA_SHORT"),
		version: env!("CARGO_PKG_VERSION"),
		executable_name: "joystream-node",
		author: "Joystream",
		description: "Joystream substrate node",
		support_url: "https://www.joystream.org/",
	};
	cli::run(::std::env::args(), cli::Exit, version)
}

quick_main!(run);
