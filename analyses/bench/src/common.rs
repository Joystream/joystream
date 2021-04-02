use std::str::FromStr;

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

#[derive(Clone, Copy, Debug, derive_more::Display)]
pub enum DatabaseSize {
    #[display(fmt = "small")]
    Small,
    #[display(fmt = "medium")]
    Medium,
    #[display(fmt = "large")]
    Large,
    #[display(fmt = "huge")]
    Huge,
}

#[derive(Clone, Copy, Debug, derive_more::Display)]
pub struct ParseDatabaseSizeError;

impl FromStr for DatabaseSize {
    type Err = ParseDatabaseSizeError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().trim() {
            "small" => Ok(Self::Small),
            "medium" => Ok(Self::Medium),
            "large" => Ok(Self::Large),
            "huge" => Ok(Self::Huge),
            _ => Err(ParseDatabaseSizeError),
        }
    }
}

impl DatabaseSize {
    /// Should be multiple of SAMPLE_SIZE!
    pub(crate) fn keys(&self) -> usize {
        match *self {
            Self::Small => 10_000,
            Self::Medium => 100_000,
            Self::Large => 200_000,
            Self::Huge => 1_000_000,
        }
    }
}
