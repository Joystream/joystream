#[cfg(feature = "std")]
extern crate serde;

extern crate sr_io as runtime_io;
extern crate sr_primitives as runtime_primitives;
extern crate sr_std as rstd;
extern crate substrate_primitives as primitives;

extern crate srml_system as system;

use runtime_support::dispatch::Result;
use runtime_support::StorageValue;
use runtime_primitives::traits::{Hash};
use rstd::prelude::*;

pub trait Trait: system::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as MerkleTree {
        // Root hash of the tree
        RootHash get(root_hash): Option<T::Hash>;
        // Number of nodes in the tree
        //NNodes get(n_nodes): u128;
        // Hashes of the edge nodes needed for pairing with next insert
        //EdgeNodes get(edge_nodes): Vec<Option<T::Hash>>;
    }
}

decl_event!(
    // Event fired when new addition is added. Whole tree can be derived on client from these events
    pub enum Event<T> where <T as system::Trait>::Hash {
		Insert(Hash),
	}
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        // Prove that `value` hash index of `node_index` and that it exists inside `root_hash` state
        pub fn verify_proof(merkle_path: &Vec<T::Hash>, value: Vec<u8>) -> Result {
            let mut value_hash = T::Hashing::hash_of(&value);
            for h_el in merkle_path.iter() {
                value_hash = T::Hashing::hash_of(&[h_el, value_hash]);
            }
                
            let root_hash = <RootHash>::root_hash()?;
            ensure!(value_hash == root_hash, "Proof not valid");
            Ok(())
        }

        pub fn generate_proof(full_vector: Vec<T::Hash>) -> Result {
            // not really necessary 
            let mut value_hash = T::Hashing::hash_of(&value);
            for h_el in proof.iter() {
                value_hash = T::Hashing::hash_of(&[h_el, value_hash]);
            }
                
            let root_hash = <RootHash>::root_hash()?;
            ensure!(value_hash == root_hash, "Proof not valid");
            Ok(())
        }
    }
}

impl Module<T: Trait> {
    fn merkle_path<T>(b: &Vec<T>, index: u64){
         let mut i = index; 
         //check range
         let h: u32 = (b.len() as f64).log2().ceil() as u32;
         if 2u64.pow(h-1) <= i && 2u64.pow(h) > i {
             let mut f : u64 = i;
             let mut rem : u64 = 0;
             let mut path = Vec::new();
             let mut o: u64 = i;
             while i > 1 {
                 f = i>>1;
                 rem = i%2;
                 o = 2 * f + (1- rem);
                 path.push(o);
                 i = f;
             }
             println!("merkle path {:?}", path);
         } else {
             println!("not a leaf");
         }
     }
   fn gen_proof(b: &Vec<u64>) -> Option<u64>{
     let mut out = Vec::new();
     for e in b.iter() { 
         out.push(*e);
     }

     let mut start: usize = 0;
     let mut last_len = out.len();
     let mut max_len = last_len >> 1;
     let mut rem = last_len % 2; 

     while max_len != 0 {
         last_len = out.len();
         for i in 0..max_len { 
             out.push(out[start + 2*i]+ out[start + 2*i + 1]);
         }
         if rem == 1 {
             //println!("test {}", last_len);
             out.push(out[last_len-1]);
         }
         rem = max_len % 2;
         max_len = max_len >> 1;
         start = last_len;
     }
     last_len = out.len();
     if last_len >= 2 {
         out.push(out[last_len-2]+out[last_len-1]);
     }
     //println!("RESULT {:?}", out);
     out.last().copied()
  }
    // test
} 
