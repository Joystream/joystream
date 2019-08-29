// Copyright 2019 Parity Technologies (UK) Ltd.
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

use wasm_builder_runner::{build_current_project_with_rustflags, WasmBuilderSource};

/*
Error appears in Cargo.toml in VisualStudio Code

failed to run custom build command for `joystream-node-runtime v6.0.0 (/Users/mokhtar/joystream/runtime)`
process didn't exit successfully: `/Users/mokhtar/joystream/runtime/target/rls/debug/build/joystream-node-runtime-c5155b3ff357b0c8/build-script-build` (exit code: 1)
--- stdout
Unknown argument 'run'. Supported arguments:

    --version or -V to print the version and commit info
    --help or -h for this message
    --cli starts the RLS in command line mode
    No input starts the RLS as a language server

seems `rls run ...` is being run instead of `rustup run ...`
*/

fn main() {
    build_current_project_with_rustflags(
        "wasm_binary.rs",
        WasmBuilderSource::Crates("1.0.4"),
        // This instructs LLD to export __heap_base as a global variable, which is used by the
        // external memory allocator.
        "-Clink-arg=--export=__heap_base",
    );
}
