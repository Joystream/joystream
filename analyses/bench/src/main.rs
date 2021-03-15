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
mod simple_trie;
mod state_sizes;
mod tempdb;
mod trie;
mod trie_series;

use std::convert::TryFrom;

use plotters::prelude::*;
use structopt::StructOpt;

use crate::{
    common::DatabaseSize,
    core::{run_benchmark, run_series_benchmark, BenchmarkDescription, Mode as BenchmarkMode},
    state_sizes::KUSAMA_STATE_DISTRIBUTION,
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

fn plot_points(
    name: String,
    series: Vec<Vec<(usize, std::time::Duration)>>,
    bench_avg: u64,
    sd: f64,
    model: RegressionModel,
) {
    let open_image_time = std::time::Instant::now();
    let plot_name = format!("{}.png", name);
    let root = BitMapBackend::new(&plot_name, (1920, 1080)).into_drawing_area();

    root.fill(&WHITE).unwrap();

    log::info!(
        "Open image time: {}ms",
        open_image_time.elapsed().as_millis()
    );

    let get_limits_time = std::time::Instant::now();
    let series_iter = series
        .into_iter()
        .flatten()
        .map(|(size, val)| (size, f64::from(u32::try_from(val.as_micros()).unwrap())));

    let max_x = series_iter
        .clone()
        .map(|(x, _)| x)
        .max()
        .expect("Series shouldn't be empty");

    let max_y = series_iter
        .clone()
        .map(|(_, y)| y)
        .max_by(|x, y| x.partial_cmp(y).expect("No value should be None"))
        .expect("Series shouldn't be empty");

    log::info!(
        "Get limits time: {}ms",
        get_limits_time.elapsed().as_millis()
    );

    let max_avg_y = f64::from(u32::try_from(bench_avg).unwrap()) + sd;
    let max_y = max_avg_y.max(max_y);

    let create_chart_time = std::time::Instant::now();
    let x_range = 0usize..max_x;

    let mut chart = ChartBuilder::on(&root)
        .caption(name, ("sans-serif", 30))
        .margin(40)
        .y_label_area_size(100)
        .x_label_area_size(80)
        .build_cartesian_2d(x_range.clone(), 0f64..max_y)
        .unwrap();

    log::info!(
        "Create chart time: {}ms",
        create_chart_time.elapsed().as_millis()
    );

    let prepare_graph_time = std::time::Instant::now();
    chart
        .configure_mesh()
        .x_labels(30)
        .y_desc("Time(ms)")
        .x_desc("Entry size(B)")
        .axis_desc_style(("sans-serif", 25))
        .x_label_style(("sans-serif", 25))
        .y_label_style(("sans-serif", 25))
        .draw()
        .unwrap();

    log::info!(
        "Prepare time: {}ms",
        prepare_graph_time.elapsed().as_millis()
    );

    let graph_time = std::time::Instant::now();

    chart
        .draw_series(series_iter.map(|point| Circle::new(point, 5, &BLUE)))
        .unwrap()
        .label("Raw Benchmark Data")
        .legend(|(x, y)| PathElement::new(vec![(x, y), (x + 20, y)], &BLUE));

    chart
        .draw_series(vec![Rectangle::new(
            [
                (0, (f64::from(u32::try_from(bench_avg).unwrap()) + sd)),
                (max_x, (f64::from(u32::try_from(bench_avg).unwrap()) - sd)),
            ],
            GREEN.mix(0.5).filled(),
        )])
        .unwrap()
        .label("Standard Benchmark data")
        .legend(|(x, y)| PathElement::new(vec![(x, y), (x + 20, y)], &GREEN));

    let x_range_f64 = x_range
        .clone()
        .map(|x| f64::from(u32::try_from(x).unwrap()));
    chart
        .draw_series(LineSeries::new(
            x_range.zip(model.predict(vec![("X", x_range_f64.collect())]).unwrap()),
            &RED,
        ))
        .unwrap()
        .label("Linear regression")
        .legend(|(x, y)| PathElement::new(vec![(x, y), (x + 20, y)], &RED));

    chart
        .configure_series_labels()
        .background_style(WHITE.filled())
        .label_font(("sans-serif", 25))
        .position(SeriesLabelPosition::UpperLeft)
        .draw()
        .unwrap();

    log::info!("Graph time: {}ms", graph_time.elapsed().as_millis());
}

fn plot_hist() {
    let root = BitMapBackend::new("state_dist.png", (1920, 1080)).into_drawing_area();

    root.fill(&WHITE).unwrap();

    let max_count = KUSAMA_STATE_DISTRIBUTION
        .iter()
        .map(|(_, y)| y)
        .max()
        .unwrap();

    let mut chart = ChartBuilder::on(&root)
        .x_label_area_size(70)
        .y_label_area_size(150)
        .margin(80)
        .caption("State distribution", ("sans-serif", 50))
        .build_cartesian_2d((0u32..9000u32).into_segmented(), 0u32..*max_count)
        .unwrap();

    chart
        .configure_mesh()
        .disable_x_mesh()
        .bold_line_style(&WHITE.mix(0.3))
        .y_desc("Count")
        .x_desc("Size(B)")
        .x_labels(20)
        .x_label_style(("sans-serif", 25))
        .y_label_style(("sans-serif", 25))
        .axis_desc_style(("sans-serif", 25))
        .draw()
        .unwrap();

    chart
        .draw_series(
            Histogram::vertical(&chart)
                .margin(1)
                .style(RED.mix(0.5).filled())
                .data(KUSAMA_STATE_DISTRIBUTION.iter().map(|(x, y)| (*x, *y))),
        )
        .unwrap();
}
