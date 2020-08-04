use sc_executor::native_executor_instance;

// Declare an instance of the native executor named `Executor`. Include the wasm binary as the
// equivalent wasm code.
native_executor_instance!(
    pub Executor,
    node_runtime::api::dispatch,
    node_runtime::native_version,
    frame_benchmarking::benchmarking::HostFunctions,
);
