const BN = require('bn.js')
const types = require('@joystream/types')

async function getRuntimeVersionFromWasm(wasm) {
  const memory = new WebAssembly.Memory({ initial: 21 })
  // pointer into heap used to keep track of malloc'ed memory
  // https://spec.polkadot.network/#defn-runtime-pointer
  let allocPointer = 0

  const module = await WebAssembly.instantiate(wasm, {
    env: {
      memory,
      // Just a silly memory allocator :) sufficient to have Core_version() work.
      // https://spec.polkadot.network/#id-ext_allocator_malloc
      //! The runtime code must export a global symbol named `__heap_base` of type `i32`. Any memory
      //! whose offset is below the value of `__heap_base` can be used at will by the program, while
      //! any memory above `__heap_base` but below `__heap_base + heap_pages` (where `heap_pages` is
      //! the value passed as parameter to [`HostVmPrototype::new`]) is available for use by the
      //! implementation of `ext_allocator_malloc_version_1`.
      ext_allocator_malloc_version_1: (size) => {
        allocPointer += size
        return module.instance.exports.__heap_base + allocPointer
      },
      // dummy runtime host functions for polkadot/substrate node
      ext_hashing_blake2_128_version_1: () => {},
      ext_hashing_blake2_256_version_1: () => {},
      ext_hashing_twox_128_version_1: () => {},
      ext_hashing_twox_64_version_1: () => {},
      ext_allocator_free_version_1: () => {},
      ext_storage_append_version_1: () => {},
      ext_storage_clear_version_1: () => {},
      ext_storage_clear_prefix_version_2: () => {},
      ext_storage_commit_transaction_version_1: () => {},
      ext_storage_exists_version_1: () => {},
      ext_storage_get_version_1: () => {},
      ext_storage_next_key_version_1: () => {},
      ext_storage_read_version_1: () => {},
      ext_storage_rollback_transaction_version_1: () => {},
      ext_storage_root_version_2: () => {},
      ext_storage_set_version_1: () => {},
      ext_storage_start_transaction_version_1: () => {},
      ext_misc_print_hex_version_1: () => {},
      ext_misc_print_num_version_1: () => {},
      ext_misc_print_utf8_version_1: () => {},
      ext_misc_runtime_version_version_1: () => {},
      ext_trie_blake2_256_ordered_root_version_2: () => {},
      ext_offchain_is_validator_version_1: () => {},
      ext_offchain_local_storage_clear_version_1: () => {},
      ext_offchain_local_storage_compare_and_set_version_1: () => {},
      ext_offchain_local_storage_get_version_1: () => {},
      ext_offchain_local_storage_set_version_1: () => {},
      ext_offchain_network_state_version_1: () => {},
      ext_offchain_random_seed_version_1: () => {},
      ext_offchain_submit_transaction_version_1: () => {},
      ext_offchain_timestamp_version_1: () => {},
      ext_offchain_index_set_version_1: () => {},
      ext_crypto_ed25519_generate_version_1: () => {},
      ext_crypto_ed25519_verify_version_1: () => {},
      ext_crypto_finish_batch_verify_version_1: () => {},
      ext_crypto_secp256k1_ecdsa_recover_compressed_version_2: () => {},
      ext_crypto_sr25519_generate_version_1: () => {},
      ext_crypto_sr25519_public_keys_version_1: () => {},
      ext_crypto_sr25519_sign_version_1: () => {},
      ext_crypto_sr25519_verify_version_2: () => {},
      ext_crypto_start_batch_verify_version_1: () => {},
      ext_logging_log_version_1: (a) => {},
      ext_logging_max_level_version_1: () => {},
    },
  })

  //! ## Runtime version
  //!
  //! Wasm files can contain so-called custom sections. A runtime can contain two custom sections
  //! whose names are `"runtime_version"` and `"runtime_apis"`, in which case they must contain a
  //! so-called runtime version.
  //!
  //! The runtime version contains important field that identifies a runtime.
  //!
  //! If no `"runtime_version"` and `"runtime_apis"` custom sections can be found, the
  //! `Core_version` entry point is used as a fallback in order to obtain the runtime version. This
  //! fallback mechanism is maintained for backwards compatibility purposes, but is considered
  //! deprecated.
  // Couldn't figure out how to find these "custom sections" so just using Core_version entry point.
  const result = module.instance.exports.Core_version()

  //! The function returns a 64 bits number. The 32 less significant bits represent a pointer to the
  //! Wasm virtual machine's memory, and the 32 most significant bits a length. This pointer and
  //! length designate a buffer containing the actual return value.
  // https://spec.polkadot.network/#defn-runtime-pointer-size
  const pointerSize = new BN(result)
  const size = pointerSize.shrn(32).toNumber() // 32 most significant bits
  const pointer = pointerSize.maskn(32).toNumber() // 32 least significant bits

  // get data returned by the call from memory
  const data = memory.buffer.slice(pointer, pointer + size)
  // Decode data as `RuntimeVersion` struct
  return types.createType('RuntimeVersion', Buffer.from(data))
}

module.exports = {
  getRuntimeVersionFromWasm,
}
