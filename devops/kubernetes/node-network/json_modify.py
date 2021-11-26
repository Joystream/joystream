#!/usr/bin/python
import argparse
import json

def main(chain_path, prefix, number_of_validators):
    chain_spec_path = f"{chain_path}/chainspec.json"
    print(f"Updating chain spec file {chain_spec_path}")
    number_of_validators = int(number_of_validators)

    with open(chain_spec_path) as f:
        data = json.load(f)

    response = {
        "name": f'{data["name"]} {prefix}',
        "id": f'{data["id"]}_{prefix}',
        "protocolId": f'{data["protocolId"]}{prefix}'
    }

    boot_node_list = data["bootNodes"]
    for i in range(1, number_of_validators + 1):
        public_key = open(f"{chain_path}/publickey{i}").read().replace('\n', '')
        boot_node = f"/dns4/node-{i}/tcp/30333/p2p/{public_key}"
        boot_node_list.append(boot_node)

    telemetry_endpoints = data["telemetryEndpoints"]
    telemetry_endpoints.append([
        "/dns/telemetry.joystream.org/tcp/443/x-parity-wss/%2Fsubmit%2F", 0])

    response["bootNodes"] = boot_node_list
    response["telemetryEndpoints"] = telemetry_endpoints

    data.update(response)
    with open(chain_spec_path, 'w') as outfile:
        json.dump(data, outfile, indent=4)
    print("Chain spec file updated")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Modify Chain Spec file')
    parser.add_argument('--path', required=True, help="Path to chain data")
    parser.add_argument('--prefix', required=True, help="Network prefix")
    parser.add_argument('--validators', required=True, help="Number of Validators")
    args = parser.parse_args()
    print(args.path)
    main(chain_path=args.path, prefix=args.prefix, number_of_validators=args.validators)
