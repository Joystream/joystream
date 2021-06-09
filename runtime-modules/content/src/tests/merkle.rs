#![cfg(test)]

use super::mock::*;
use crate::*;
use sp_core::Hasher;

type TestHash = <Test as frame_system::Trait>::Hash;
type TestHashing = <Test as frame_system::Trait>::Hashing;

fn merkle_path(len: usize, index: usize) -> Vec<usize> {
    let mut idx = index;
    assert!(idx > 0);
    let floor_2 = |x: usize| (x >> 1) + (x % 2);
    let mut path = Vec::new();
    let mut prev_len: usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el {
            path.push(prev_len + idx);
        } else {
            match idx % 2 {
                1 => path.push(prev_len + idx + 1),
                _ => path.push(prev_len + idx - 1),
            };
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);
    }
    return path;
}
fn gen_proof<E: Encode>(collection: &[E]) -> Result<Vec<TestHash>, &'static str> {
    if collection.len() == 0 {
        return Err("empty vector");
    }
    let mut out = Vec::new();
    for e in collection.iter() {
        out.push(TestHashing::hash(&e.encode()));
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
            out.push(TestHashing::hash(
                &[out[start + 2 * i], out[start + 2 * i + 1]].encode(),
            ));
        }
        if rem == 1 {
            out.push(TestHashing::hash(
                &[out[last_len - 1], out[last_len - 1]].encode(),
            ));
        }
        let new_len = out.len() - last_len;
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    Ok(out)
}

fn helper_build_merkle_path<E: Encode>(
    collection: &[E],
    idx: usize,
    out: &[TestHash],
) -> Vec<TestHash> {
    let path = merkle_path(collection.len(), idx + 1);
    let merkle_proof = path.iter().map(|i| out[*i - 1]).collect();
    merkle_proof
}

#[test]
fn elements_does_belong_to_collection() {
    with_default_mock_builder(|| {
        let out = gen_proof(&PULL_PAYMENTS_COLLECTION).unwrap();
        let root = out.last().copied().unwrap();
        let _x = Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);

        let mut res = false;
        for idx in 0..PULL_PAYMENTS_COLLECTION.len() {
            let merkle_proof = helper_build_merkle_path(&PULL_PAYMENTS_COLLECTION, idx, &out);
            if let Ok(ans) =
                Content::verify_proof(&merkle_proof, &VALUE_BELONGING_TO_COLLECTION, idx)
            {
                res = res || ans;
            };
        }
        assert_eq!(res, true);
    });
}

#[test]
fn elements_doesnt_belong_to_collection() {
    with_default_mock_builder(|| {
        let out = gen_proof(&PULL_PAYMENTS_COLLECTION).unwrap();
        let root = out.last().copied().unwrap();
        let _x = Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);

        let mut res = true;
        for idx in 0..PULL_PAYMENTS_COLLECTION.len() {
            let merkle_proof = helper_build_merkle_path(&PULL_PAYMENTS_COLLECTION, idx, &out);
            if let Ok(ans) =
                Content::verify_proof(&merkle_proof, &VALUE_NOT_BELONGING_TO_COLLECTION, idx)
            {
                res = res && ans;
            };
        }
        assert_eq!(res, false);
    });
}
#[test]
fn merkle_root_update() {
    with_default_mock_builder(|| {
        let mut root = TestHashing::hash(&PULL_PAYMENTS_COLLECTION.encode());
        let mut _x = Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);

        // no event deposit since block 0
        run_to_block(1);

        root = TestHashing::hash(
            &PULL_PAYMENTS_COLLECTION
                .iter()
                .map(|x| x + 1)
                .collect::<Vec<i32>>()
                .encode(),
        );
        _x = Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::RootUpdated(root))
        );
    })
}
