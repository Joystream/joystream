// This file is part of Substrate.

// Copyright (C) 2020-2021 Parity Technologies (UK) Ltd.
// SPDX-License-Identifier: GPL-3.0-or-later WITH Classpath-exception-2.0

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

mod common;
#[macro_use]
mod core;
mod generator;
mod plots;
mod simple_trie;
mod state_sizes;
mod tempdb;
mod trie;
mod trie_series;

use std::convert::TryFrom;

#[cfg(feature = "plot")]
use crate::plots::*;

use structopt::StructOpt;

use crate::{
    common::DatabaseSize,
    core::{run_benchmark, run_series_benchmark, BenchmarkDescription, Mode as BenchmarkMode},
    tempdb::DatabaseType,
    trie::{TrieReadBenchmarkDescription, TrieWriteBenchmarkDescription},
    trie_series::{TrieReadSeriesBenchmarkDescription, TrieWriteSeriesBenchmarkDescription},
};

use linregress::{FormulaRegressionBuilder, RegressionDataBuilder, RegressionModel};

#[derive(Debug, StructOpt)]
#[structopt(name = "node-bench", about = "Node integration benchmarks")]
struct Opt {
    /// Machine readable json output.
    ///
    /// This also suppresses all regular output (except to stderr)
    #[structopt(short, long)]
    json: bool,

    /// Database size.
    ///
    /// Size of the Database to use
    size: DatabaseSize,

    /// Number of transactions for block import with `custom` size.
    #[structopt(long)]
    transactions: Option<usize>,

    /// Mode
    ///
    /// "regular" for regular benchmark
    ///
    /// "profile" mode adds pauses between measurable runs,
    /// so that actual interval can be selected in the profiler of choice.
    #[structopt(short, long, default_value = "regular")]
    mode: BenchmarkMode,
}

fn main() {
    let opt = Opt::from_args();

    if !opt.json {
        sp_tracing::try_init_simple();
    }

    let database_size = opt.size;

    let series_benchmarks: Vec<Box<dyn BenchmarkDescription>> = vec![
        Box::new(TrieReadSeriesBenchmarkDescription {
            database_size,
            database_type: DatabaseType::RocksDb,
            max_sample_size: 200_000,
        }),
        Box::new(TrieWriteSeriesBenchmarkDescription {
            database_size,
            database_type: DatabaseType::RocksDb,
            max_sample_size: 200_000,
        }),
    ];

    let benchmarks: Vec<Box<dyn BenchmarkDescription>> = vec![
        Box::new(TrieReadBenchmarkDescription {
            database_size,
            database_type: DatabaseType::RocksDb,
        }),
        Box::new(TrieWriteBenchmarkDescription {
            database_size,
            database_type: DatabaseType::RocksDb,
        }),
    ];

    let mut series_results = Vec::new();
    let bench_total_time = std::time::Instant::now();
    let bench_time = std::time::Instant::now();
    for benchmark in series_benchmarks {
        log::info!("Starting {}", benchmark.name());
        series_results.push(run_series_benchmark(benchmark, opt.mode));
    }

    log::info!("Bench series time: {}ms", bench_time.elapsed().as_millis());

    let mut results = Vec::new();

    let bench_time = std::time::Instant::now();
    for benchmark in benchmarks {
        log::info!("Starting {}", benchmark.name());
        results.push(run_benchmark(benchmark, opt.mode));
    }

    log::info!(
        "Bench non-series time: {}ms",
        bench_time.elapsed().as_millis()
    );

    log::info!(
        "Bench total time: {}ms",
        bench_total_time.elapsed().as_millis()
    );

    let plot_time = std::time::Instant::now();

    for (i, series_result) in series_results.iter().enumerate() {
        let model = fit_model(series_result.raw.clone());
        println!(
            "Standard benchmark for {} took {}µs +/- {}µs ",
            results[i].name, results[i].average, results[i].sd
        );

        println!(
            "Our model benchmark for {} is: y = a * x + b",
            series_result.name
        );

        println!("with a = {}", model.parameters.pairs()[0].1,);

        println!("with b = {}", model.parameters.intercept_value,);

        println!("and R-Squared: {}", model.rsquared);

        println!(
            "The time for a read of 120kb is (average benchmarked time no-prediction): {}µs",
            series_result
                .average
                .iter()
                .filter(|(x, _)| 120_000 <= *x && *x <= 121_000)
                .last()
                .unwrap()
                .1
        );

        #[cfg(feature = "plot")]
        plot_points(
            series_result.name.clone(),
            series_result.raw.clone(),
            results[i].average,
            results[i].sd,
            model,
        );
    }

    log::info!("Plot time: {}ms", plot_time.elapsed().as_millis());

    let plot_time = std::time::Instant::now();

    #[cfg(feature = "plot")]
    plot_hist();

    log::info!("Plot time: {}ms", plot_time.elapsed().as_millis());
}

fn fit_model(series: Vec<Vec<(usize, std::time::Duration)>>) -> RegressionModel {
    let (x, y): (Vec<f64>, Vec<f64>) = series
        .iter()
        .flatten()
        .map(|(x, d)| (*x, d.as_micros()))
        .map(|(x, y)| (u32::try_from(x).unwrap(), u32::try_from(y).unwrap()))
        .map(|(x, y)| (f64::from(x), f64::from(y)))
        .unzip();
    let data = vec![("Y", y), ("X", x)];
    let formula = "Y ~ X";
    let data = RegressionDataBuilder::new().build_from(data).unwrap();

    FormulaRegressionBuilder::new()
        .data(&data)
        .formula(formula)
        .fit()
        .expect("Can't fit data to linear model")
}
