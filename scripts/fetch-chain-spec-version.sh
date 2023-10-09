curl -H "Content-Type: application/json" \
    -s -d '{"id":"1", "jsonrpc":"2.0", "method": "state_getRuntimeVersion"}' \
    http://localhost:9933 | jq -r '.result.specVersion'
