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

use serde::Serialize;
use std::{
    borrow::{Cow, ToOwned},
    convert::TryInto,
};

pub struct Path(Vec<String>);

impl Path {
    pub fn new(initial: &'static [&'static str]) -> Self {
        Path(initial.iter().map(|x| x.to_string()).collect())
    }
}

impl Path {
    pub fn push(&mut self, item: &str) {
        self.0.push(item.to_string());
    }
}

pub trait BenchmarkDescription {
    fn path(&self) -> Path;

    fn setup(self: Box<Self>) -> Box<dyn Benchmark>;

    fn name(&self) -> Cow<'static, str>;
}

pub trait Benchmark {
    fn run(&mut self, mode: Mode) -> Vec<(usize, std::time::Duration)>;
}

#[derive(Debug, Clone, Serialize)]
pub struct BenchmarkOutput {
    pub name: String,
    raw_average: u64,
    pub average: u64,
    pub sd: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct BenchmarkSeriesOutput {
    // TODO: make private again
    pub name: String,
    pub raw: Vec<Vec<(usize, std::time::Duration)>>,
    pub average: Vec<(usize, u128)>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Mode {
    Regular,
    Profile,
}

impl std::str::FromStr for Mode {
    type Err = &'static str;
    fn from_str(day: &str) -> Result<Self, Self::Err> {
        match day {
            "regular" => Ok(Mode::Regular),
            "profile" => Ok(Mode::Profile),
            _ => Err("Could not parse mode"),
        }
    }
}

fn calc_average(vecs: &[Vec<(usize, std::time::Duration)>]) -> Vec<(usize, u128)> {
    let mut avg = Vec::new();
    for i in 0..vecs[0].len() {
        avg.push((
            vecs[0][i].0,
            vecs.iter()
                .map(|v| v[i])
                .map(|(_, t)| t.as_micros())
                .sum::<u128>()
                / vecs.len() as u128,
        ));
    }

    avg
}

pub fn run_benchmark(benchmark: Box<dyn BenchmarkDescription>, mode: Mode) -> BenchmarkOutput {
    let name = benchmark.name().to_owned();
    let mut benchmark = benchmark.setup();

    let mut durations = Vec::new();
    for _ in 0..50 {
        let duration = benchmark.run(mode);
        let duration_len = duration.len();
        durations.push(
            (duration.iter().map(|(_, d)| d).sum::<std::time::Duration>() / duration_len as u32)
                .as_micros(),
        );
    }

    durations.sort_unstable();

    let raw_average = (durations.iter().sum::<u128>() / (durations.len() as u128)) as u64;
    let average = (durations.iter().skip(10).take(30).sum::<u128>() / 30) as u64;
    let avg: i32 = average.try_into().unwrap();
    let sd: f64 = durations
        .into_iter()
        .skip(10)
        .take(30)
        .map(|d| d.try_into().unwrap())
        .map(|d: i32| d - avg)
        .map(|x: i32| x * x)
        .map::<u32, _>(|x: i32| x.try_into().unwrap())
        .sum::<u32>()
        .into();

    let sd = sd.sqrt() / 30.0_f64.sqrt();

    BenchmarkOutput {
        name: name.into(),
        raw_average,
        average,
        sd,
    }
}

pub fn run_series_benchmark(
    benchmark: Box<dyn BenchmarkDescription>,
    mode: Mode,
) -> BenchmarkSeriesOutput {
    let name = benchmark.name().to_owned();
    let mut benchmark = benchmark.setup();

    let mut durations = Vec::new();
    for _ in 0..50 {
        let duration = benchmark.run(mode);
        durations.push(duration);
    }

    durations.sort();
    let average = calc_average(&durations);

    BenchmarkSeriesOutput {
        name: name.into(),
        raw: durations,
        average,
    }
}
