## Fuzzing

### Install dependencies
```
sudo apt install build-essential binutils-dev libunwind-dev libblocksruntime-dev liblzma-dev
```

### Run
Variant I - honggfuzz
```
HFUZZ_RUN_ARGS="-N 8 --exit_upon_crash --keep_output" cargo hfuzz run test_fuzzing
```

Variant II - libfuzzer
```
cargo fuzz run fuzz_target_1 -- -max_len=256 -runs=10
```
