FEATURES=
if [[ "$RUNTIME_PROFILE" == "TESTING" ]]; then
  FEATURES="testing_runtime"
fi

if [[ "$RUNTIME_PROFILE" == "STAGING" ]]; then
  FEATURES="staging_runtime"
fi

if [[ "$RUNTIME_PROFILE" == "PLAYGROUND" ]]; then
  FEATURES="playground_runtime"
fi