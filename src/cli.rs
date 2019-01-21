use service;
use futures::{future, Future, sync::oneshot};
use std::cell::RefCell;
use tokio::runtime::Runtime;
pub use substrate_cli::{VersionInfo, IntoExit, error};
use substrate_cli::{Action, informant, parse_matches, execute_default, CoreParams};
use substrate_service::{ServiceFactory, Roles as ServiceRoles};
use chain_spec;
use std::ops::Deref;
use structopt::StructOpt;

/// Extend params for Node
#[derive(Debug, StructOpt)]
pub struct NodeParams {
	/// Should run as a GRANDPA authority node
	#[structopt(long = "grandpa-authority", help = "Run Node as a GRANDPA authority, implies --validator")]
	grandpa_authority: bool,

	/// Should run as a GRANDPA authority node only
	#[structopt(long = "grandpa-authority-only", help = "Run Node as a GRANDPA authority only, don't as a usual validator, implies --grandpa-authority")]
	grandpa_authority_only: bool,

	#[structopt(flatten)]
	core: CoreParams
}

/// Parse command line arguments into service configuration.
pub fn run<I, T, E>(args: I, exit: E, version: VersionInfo) -> error::Result<()> where
	I: IntoIterator<Item = T>,
	T: Into<std::ffi::OsString> + Clone,
	E: IntoExit,
{
	let full_version = substrate_service::config::full_version_from_strs(
		version.version,
		version.commit
	);

	let matches = match NodeParams::clap()
		.name(version.executable_name)
		.author(version.author)
		.about(version.description)
		.version(&(full_version + "\n")[..])
		.get_matches_from_safe(args) {
			Ok(m) => m,
			Err(e) => e.exit(),
		};

	let (spec, config) = parse_matches::<service::Factory, _>(
		load_spec, version, "substrate-node", &matches
	)?;

	match execute_default::<service::Factory, _>(spec, exit, &matches, &config)? {
		Action::ExecutedInternally => (),
		Action::RunService(exit) => {
			info!("Substrate Node");
			info!("  version {}", config.full_version());
			info!("  by Parity Technologies, 2017, 2018");
			info!("Chain specification: {}", config.chain_spec.name());
			info!("Node name: {}", config.name);
			info!("Roles: {:?}", config.roles);
			let mut runtime = Runtime::new()?;
			let executor = runtime.executor();
			match config.roles == ServiceRoles::LIGHT {
				true => run_until_exit(&mut runtime, service::Factory::new_light(config, executor)?, exit)?,
				false => run_until_exit(&mut runtime, service::Factory::new_full(config, executor)?, exit)?,
			}
		}
	}

	Ok(())
}

fn load_spec(id: &str) -> Result<Option<chain_spec::ChainSpec>, String> {
	Ok(match chain_spec::Alternative::from(id) {
		Some(spec) => Some(spec.load()?),
		None => None,
	})
}

fn run_until_exit<T, C, E>(
	runtime: &mut Runtime,
	service: T,
	e: E,
) -> error::Result<()>
	where
		T: Deref<Target=substrate_service::Service<C>>,
		C: substrate_service::Components,
		E: IntoExit,
{
	let (exit_send, exit) = exit_future::signal();

	let executor = runtime.executor();
	informant::start(&service, exit.clone(), executor.clone());

	let _ = runtime.block_on(e.into_exit());
	exit_send.fire();
	Ok(())
}

// handles ctrl-c
pub struct Exit;
impl IntoExit for Exit {
	type Exit = future::MapErr<oneshot::Receiver<()>, fn(oneshot::Canceled) -> ()>;
	fn into_exit(self) -> Self::Exit {
		// can't use signal directly here because CtrlC takes only `Fn`.
		let (exit_send, exit) = oneshot::channel();

		let exit_send_cell = RefCell::new(Some(exit_send));
		ctrlc::set_handler(move || {
			if let Some(exit_send) = exit_send_cell.try_borrow_mut().expect("signal handler not reentrant; qed").take() {
				exit_send.send(()).expect("Error sending exit notification");
			}
		}).expect("Error setting Ctrl-C handler");

		exit.map_err(drop)
	}
}
