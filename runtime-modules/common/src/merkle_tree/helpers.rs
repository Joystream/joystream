#![cfg(any(feature = "test", feature = "runtime-benchmarks"))]

use super::{ProofElementRecord, Side};
use codec::Encode;
use frame_system::Config;
use sp_runtime::traits::Hash;
use sp_std::vec::Vec;

#[derive(Debug)]
pub struct IndexItem {
    index: usize,
    side: Side,
}

pub fn generate_merkle_root_helper<T: Config, E: Encode>(collection: &[E]) -> Vec<T::Hash> {
    // generates merkle root from the ordered sequence collection.
    // The resulting vector is structured as follows: elements in range
    // [0..collection.len()) will be the tree leaves (layer 0), elements in range
    // [collection.len()..collection.len()/2) will be the nodes in the next to last layer (layer 1)
    // [layer_n_length..layer_n_length/2) will be the number of nodes in layer(n+1)

    if collection.is_empty() {
        return Vec::new();
    }

    let mut out = Vec::new();
    for e in collection.iter() {
        out.push(T::Hashing::hash(&e.encode()));
    }

    let mut start: usize = 0;
    let mut last_len = out.len();
    //let mut new_len = out.len();
    let mut max_len = last_len >> 1;
    let mut rem = last_len % 2;

    // range [last..(maxlen >> 1) + (maxlen % 2)]
    while max_len != 0 {
        last_len = out.len();
        for i in 0..max_len {
            out.push(T::Hashing::hash(
                &[out[start + 2 * i], out[start + 2 * i + 1]].encode(),
            ));
        }
        if rem == 1 {
            out.push(T::Hashing::hash(
                &[out[last_len - 1], out[last_len - 1]].encode(),
            ));
        }
        let new_len: usize = out.len() - last_len;
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    out
}

pub fn build_merkle_path_helper<T: Config, E: Encode + Clone>(
    collection: &[E],
    idx: usize,
) -> Vec<ProofElementRecord<T::Hash, Side>> {
    let merkle_tree = generate_merkle_root_helper::<T, _>(collection);
    // builds the actual merkle path with the hashes needed for the proof
    let index_path = index_path_helper(collection.len(), idx + 1);
    index_path
        .iter()
        .map(|idx_item| ProofElementRecord::<_, _> {
            hash: merkle_tree[idx_item.index - 1],
            side: idx_item.side,
        })
        .collect()
}

pub fn index_path_helper(len: usize, index: usize) -> Vec<IndexItem> {
    // used as a helper function to generate the correct sequence of indexes used to
    // construct the merkle path necessary for membership proof
    let mut idx = index;
    if idx == 0 {
        return Vec::new();
        // index starting at 1
    }
    let floor_2 = |x: usize| (x >> 1) + (x % 2);
    let mut path = Vec::new();
    let mut prev_len: usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el {
            path.push(IndexItem {
                index: prev_len + idx,
                side: Side::Left,
            });
        } else {
            match idx % 2 {
                1 => path.push(IndexItem {
                    index: prev_len + idx + 1,
                    side: Side::Right,
                }),
                _ => path.push(IndexItem {
                    index: prev_len + idx - 1,
                    side: Side::Left,
                }),
            };
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);
    }
    path
}
