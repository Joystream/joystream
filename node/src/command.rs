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

use crate::cli::{Cli, Subcommand};
use crate::node_executor;
use crate::node_rpc;
use crate::{chain_spec, service};

use node_executor::Executor;
use node_runtime::{opaque::Block, RuntimeApi};
use sc_cli::{Result, SubstrateCli};
use sc_finality_grandpa::{self as grandpa};

impl SubstrateCli for Cli {
    fn impl_name() -> &'static str {
        "Joystream Node"
    }

    fn impl_version() -> &'static str {
        "3.0.0"
    }

    fn description() -> &'static str {
        "Joystream substrate node"
    }

    fn author() -> &'static str {
        "Joystream contributors"
    }

    fn support_url() -> &'static str {
        "https://www.joystream.org/"
    }

    fn copyright_start_year() -> i32 {
        2019
    }

    fn executable_name() -> &'static str {
        "joystream-node"
    }

    fn load_spec(&self, id: &str) -> std::result::Result<Box<dyn sc_service::ChainSpec>, String> {
        Ok(match id {
            "dev" => Box::new(chain_spec::Alternative::Development.load().unwrap()), //TODO
            "local" => Box::new(chain_spec::Alternative::LocalTestnet.load().unwrap()),
            path => Box::new(chain_spec::ChainSpec::from_json_file(
                std::path::PathBuf::from(path),
            )?),
        })
    }
}

/// Parse command line arguments into service configuration.
pub fn run() -> Result<()> {
    let cli = Cli::from_args();

    match &cli.subcommand {
        None => {
            let runner = cli.create_runner(&cli.run)?;
            runner.run_node(service::new_light, service::new_full, node_runtime::VERSION)
        }
        Some(Subcommand::Inspect(cmd)) => {
            let runner = cli.create_runner(cmd)?;

            runner.sync_run(|config| cmd.run::<Block, RuntimeApi, Executor>(config))
        }
        Some(Subcommand::Benchmark(cmd)) => {
            if cfg!(feature = "runtime-benchmarks") {
                let runner = cli.create_runner(cmd)?;

                runner.sync_run(|config| cmd.run::<Block, Executor>(config))
            } else {
                println!(
                    "Benchmarking wasn't enabled when building the node. \
				You can enable it with `--features runtime-benchmarks`."
                );
                Ok(())
            }
        }
        Some(Subcommand::Base(subcommand)) => {
            let runner = cli.create_runner(subcommand)?;

            runner.run_subcommand(subcommand, |config| Ok(new_full_start!(config).0))
        }
    }
}
