//! Substrate Node Template CLI library.

#![warn(missing_docs)]
#![warn(unused_extern_crates)]

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

error_chain::quick_main!(run);
