#![cfg(test)]

use codec::{Encode, Decode};
use sp_core::Hasher;

use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

type TestHash = <Test as frame_system::Trait>::Hash;
type TestHashing = <Test as frame_system::Trait>::Hashing;

fn merkle_path(len: usize, index: usize) -> Vec<Option<usize>> {//Result<Vec<usize>, &'static str>{
    let mut idx = index;
    assert!(idx > 0);
    let floor_2 = |x: usize| { (x >> 1) + (x % 2) }; 
    let mut path = Vec::new(); 
    let mut prev_len : usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el { path.push(None); }
        else {
            if idx % 2 == 1 { path.push(Some(prev_len + idx + 1)) }
            else { path.push( Some(prev_len + idx - 1) ) }
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);

    }
    return path;
}

fn gen_proof<T: Encode>(b: &[T]) -> Result<Vec<TestHash>, &'static str>{
    if b.len() == 0 {
        return Err("empty vector");
    }
    let mut out = Vec::new();
    for e in b.iter() { 
        out.push(TestHashing::hash(&e.encode()));
    }

    let mut start: usize = 0;
    let mut last_len = out.len(); 
    let mut new_len = out.len(); 
    let mut max_len = last_len >> 1;
    let mut rem = last_len % 2; 

    // range [last...(maxlen >> 1) + (maxlen % 2)]
    while max_len != 0 {
        last_len = out.len();
        for i in 0..max_len { 
            out.push(TestHashing::hash(&[&out[start + 2*i],&out[start + 2*i + 1]].encode()));
        }
        if rem == 1 {
            out.push(TestHashing::hash(&out[last_len-1].encode()));
        }
        new_len = (out.len() - last_len);
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    let l = out.len(); 
    Ok(out)
}

fn helper_build_merkle_path<E: Encode>(b: &[E], idx: usize, out: &[TestHash]) -> Vec<Option<TestHash>>
{
    let path = merkle_path(b.len(), idx+1);
    let mut merkle_proof: Vec<Option<TestHash>> = Vec::new();
    for el_ in path.iter() {
        match el_ {
            Some(i) => {
                merkle_proof.push(Some(out[*i - 1]));
            },
            None => merkle_proof.push(None),
        }
    }
    return merkle_proof;
}
#[test]
fn elements_does_belong_to_collection_even() {
    with_default_mock_builder( || {
        let b = vec![1,2,3,4,5,6];
        let value = 2;
        let out = gen_proof(&b).unwrap();
        let mut res = false;
        let root = out.last().copied().unwrap();
        Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        for idx in 0..b.len() {
            let merkle_proof = helper_build_merkle_path(&b, idx, &out);
            match Content::verify_proof(&merkle_proof, &value, idx) {
                Ok(ans) => res = res || ans,
                Err(msg) => panic!(msg)
            }
        }
        assert_eq!(res, true)
    })
}
#[test]
fn elements_does_belong_to_collection_power_of_two() {
    with_default_mock_builder( || {
        let b = vec![1,2,3,4];
        let value = 2;
        let out = gen_proof(&b).unwrap();
        let mut res = false;
        let root = out.last().copied().unwrap();
        Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        for idx in 0..b.len() {
            let merkle_proof = helper_build_merkle_path(&b, idx, &out);
            match Content::verify_proof(&merkle_proof, &value, idx) {
                Ok(ans) => res = res || ans,
                Err(msg) => panic!(msg)
            }
        }
        assert_eq!(res, true)
    })
}
#[test]
fn elements_does_belong_to_collection_odd() {
    with_default_mock_builder( || {
        let b = vec![1,2,3,4,5];
        let value = 2;
        let out = gen_proof(&b).unwrap();
        let mut res = false;
        let root = out.last().copied().unwrap();
        Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        for idx in 0..b.len() {
            let merkle_proof = helper_build_merkle_path(&b, idx, &out);
            match Content::verify_proof(&merkle_proof, &value, idx) {
                Ok(ans) => res = res || ans,
                Err(msg) => panic!(msg)
            }
        }
        assert_eq!(res, true)
    })
}
#[test]
fn elements_doesnt_belong_to_collection_even() {
    with_default_mock_builder( || {
        let b = vec![1,2,3,4,5,6];
        let value = 20;
        let out = gen_proof(&b).unwrap();
        let mut res = true;
        let root = out.last().copied().unwrap();
        Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        for idx in 0..b.len() {
            let merkle_proof = helper_build_merkle_path(&b, idx, &out);
            match Content::verify_proof(&merkle_proof, &value, idx) {
                Ok(ans) => res = res && ans,
                Err(msg) => panic!(msg)
            }
        }
        assert_eq!(res, false)
    })
}
#[test]
fn elements_doesnt_belong_to_collection_odd() {
    with_default_mock_builder( || {
        let b = vec![1,2,3,4,5];
        let value = 20;
        let out = gen_proof(&b).unwrap();
        let mut res = true;
        let root = out.last().copied().unwrap();
        Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        for idx in 0..b.len() {
            let merkle_proof = helper_build_merkle_path(&b, idx, &out);
            match Content::verify_proof(&merkle_proof, &value, idx) {
                Ok(ans) => res = res && ans,
                Err(msg) => panic!(msg)
            }
        }
        assert_eq!(res, false)
    })
}
#[test]
fn elements_doesnt_belong_to_collection_power_of_two() {
    with_default_mock_builder( || {
        let b = vec![1,2,3,4,5,6,7,8];
        let value = 20;
        let out = gen_proof(&b).unwrap();
        let mut res = true;
        let root = out.last().copied().unwrap();
        Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        for idx in 0..b.len() {
            let merkle_proof = helper_build_merkle_path(&b, idx, &out);
            match Content::verify_proof(&merkle_proof, &value, idx) {
                Ok(ans) => res = res && ans,
                Err(msg) => panic!(msg)
            }
        }
        assert_eq!(res, false)
    })
}
#[test]
fn merkle_root_update_with_same_value() {
    with_default_mock_builder( || {
        let root = Content::root();
        let _test = Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        match System::events().last() {
            None => assert!(true),
            Some(e) => assert_ne!(e.event, MetaEvent::content(RawEvent::RootUpdated(root))),
        }
    } )
}
#[test]
fn merkle_root_update_with_different_value() {
    with_default_mock_builder( || {
        let root = TestHashing::hash(&3.encode());
        let mut _test = Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), root);
        let new_root = TestHashing::hash(&4.encode());
        _test = Content::update_root(Origin::signed(FIRST_CURATOR_ORIGIN), new_root);
        assert!(System::events().len() > 0);
    } )
}
