#!/usr/bin/python
import argparse
import json

def main(chain_spec_path, prefix):
    print("Updating chain spec file")
    # all_nodes = module.params["all_nodes"]

    with open(chain_spec_path) as f:
        data = json.load(f)

    response = {
        "name": f'{data["name"]} {prefix}',
        "id": f'{data["id"]}_{prefix}',
        "protocolId": f'{data["protocolId"]}{prefix}'
    }

    # boot_node_list = data["bootNodes"]
    # for key in all_nodes:
    #     if "validators" in all_nodes[key]["group_names"]:
    #         public_key = all_nodes[key]["subkey_output"]["stderr"]
    #         boot_node_list.append(f"/ip4/{key}/tcp/30333/p2p/{public_key}")

    telemetry_endpoints = data["telemetryEndpoints"]
    telemetry_endpoints.append([
        "/dns/telemetry.joystream.org/tcp/443/x-parity-wss/%2Fsubmit%2F", 0])

    # response["bootNodes"] = boot_node_list
    response["telemetryEndpoints"] = telemetry_endpoints

    data.update(response)
    with open(chain_spec_path, 'w') as outfile:
        json.dump(data, outfile, indent=4)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Modify Chain Spec file')
    parser.add_argument('--path', required=True, help="Path to chain spec file")
    parser.add_argument('--prefix', required=True, help="Network prefix")
    args = parser.parse_args()
    print(args.path)
    main(chain_spec_path=args.path, prefix=args.prefix)
