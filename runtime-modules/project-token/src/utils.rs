use codec::Encode;
use sp_runtime::traits::Hash;
use sp_std::vec::Vec;

// crate import
use crate::{types::MerkleSide, Config};

// Merkle tree Helpers
#[derive(Debug)]
pub(crate) struct IndexItem {
    index: usize,
    side: MerkleSide,
}

pub(crate) fn index_path_helper(len: usize, index: usize) -> Vec<IndexItem> {
    // used as a helper function to generate the correct sequence of indexes used to
    // construct the merkle path necessary for membership proof
    let mut idx = index;
    assert!(idx > 0); // index starting at 1
    let floor_2 = |x: usize| (x >> 1) + (x % 2);
    let mut path = Vec::new();
    let mut prev_len: usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el {
            path.push(IndexItem {
                index: prev_len + idx,
                side: MerkleSide::Left,
            });
        } else {
            match idx % 2 {
                1 => path.push(IndexItem {
                    index: prev_len + idx + 1,
                    side: MerkleSide::Right,
                }),
                _ => path.push(IndexItem {
                    index: prev_len + idx - 1,
                    side: MerkleSide::Left,
                }),
            };
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);
    }
    path
}

pub(crate) fn generate_merkle_root_helper<T: Config, E: Encode>(
    collection: &[E],
) -> Vec<<T as frame_system::Config>::Hash> {
    // generates merkle root from the ordered sequence collection.
    // The resulting vector is structured as follows: elements in range
    // [0..collection.len()) will be the tree leaves (layer 0), elements in range
    // [collection.len()..collection.len()/2) will be the nodes in the next to last layer (layer 1)
    // [layer_n_length..layer_n_length/2) will be the number of nodes in layer(n+1)
    assert!(!collection.is_empty());
    let mut out = Vec::new();
    for e in collection.iter() {
        out.push(<T as frame_system::Config>::Hashing::hash(&e.encode()));
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
            out.push(<T as frame_system::Config>::Hashing::hash(
                &[out[start + 2 * i], out[start + 2 * i + 1]].encode(),
            ));
        }
        if rem == 1 {
            out.push(<T as frame_system::Config>::Hashing::hash(
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

/// Generates merkle proof (Hash, Side) for element collection[index_for_proof]
pub(crate) fn build_merkle_path_helper<T: Config, E: Encode + Clone>(
    collection: &[E],
    index_for_proof: usize,
) -> Vec<(<T as frame_system::Config>::Hash, MerkleSide)> {
    let merkle_tree = generate_merkle_root_helper::<T, _>(collection);
    // builds the actual merkle path with the hashes needed for the proof
    let index_path = index_path_helper(collection.len(), index_for_proof + 1);
    index_path
        .iter()
        .map(|idx_item| (merkle_tree[idx_item.index - 1], idx_item.side))
        .collect()
}
