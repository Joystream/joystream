FEATURES=
if [[ "$RUNTIME_PROFILE" == "TESTING" ]]; then
  FEATURES="testing-runtime"
fi

if [[ "$RUNTIME_PROFILE" == "STAGING" ]]; then
  FEATURES="staging-runtime"
fi

if [[ "$RUNTIME_PROFILE" == "PLAYGROUND" ]]; then
  FEATURES="playground-runtime"
fi