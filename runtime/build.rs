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

use std::{env, process::Command, string::String};
use wasm_builder_runner::{WasmBuilder, WasmBuilderSource};

fn main() {
    if !in_real_cargo_environment() {
        env::set_var("BUILD_DUMMY_WASM_BINARY", "1");
        println!("Building DUMMY Wasm binary");
    }

    let file_name = "wasm_binary.rs";
    let wasm_builder_source = WasmBuilderSource::Crates("1.0.9");
    // This instructs LLD to export __heap_base as a global variable, which is used by the
    // external memory allocator.
    let default_rust_flags = "-Clink-arg=--export=__heap_base";

    WasmBuilder::new()
        .with_current_project()
        .with_wasm_builder_source(wasm_builder_source)
        .append_to_rust_flags(default_rust_flags)
        .set_file_name(file_name)
        .build()
}

fn in_real_cargo_environment() -> bool {
    let cargo =
        env::var("CARGO").expect("`CARGO` env variable is always set when executing `build.rs`.");
    let mut cmd = Command::new(cargo);
    cmd.arg("--version");
    let output = cmd.output().expect("failed to get cargo version");
    let version = String::from_utf8(output.stdout).unwrap();
    println!("{}", version);
    // if we are building in an IDE (Code or Atom) with RLS extension the version
    // would start with "rls"
    version.starts_with("cargo")
}
