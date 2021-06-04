#![cfg(test)]

use codec::{Encode, Decode};
use sp_core::{
    H256,
    Hasher,
    Blake2Hasher,
};

use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

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

fn gen_proof_<T: Encode>(b: &Vec<T>) -> Result<Vec<H256>, &'static str>{
    if b.len() == 0 {
        return Err("empty vector");
    }
    let mut out = Vec::new();
    for e in b.iter() { 
        out.push(Blake2Hasher::hash(&e.encode()));
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
            out.push(Blake2Hasher::hash(&[&out[start + 2*i],&out[start + 2*i + 1]].encode()));
        }
        if rem == 1 {
            out.push(Blake2Hasher::hash(&out[last_len-1].encode()));
        }
        new_len = (out.len() - last_len);
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    let l = out.len(); 
    Ok(out)
}

#[test]
fn test_1() {
    with_default_mock_builder( || {
        let b = vec![1,2,3];
        let idx: usize =  1;
        let value = 2;
        let out = gen_proof_(&b).unwrap();
        let root = out.last().copied().unwrap();
        // root create add to storage 
        Content::update_root(Origin::signed(LEAD_ORIGIN), root);

        // build merkle path
        let index_path = merkle_path(b.len(), idx+1);
        let mut path: Vec<Option<H256>> = Vec::new();
        for el_ in index_path.iter() {
            match el_ {
                Some(i) => {
                    path.push(Some(out[*i - 1]));
                },
                None => path.push(None),
            }
        }
        match Content::verify_proof(&path, &value, idx) {
            Ok(root) => assert_eq!(root, true),
            Err(msg) => panic!(msg),
        }
    })

}
