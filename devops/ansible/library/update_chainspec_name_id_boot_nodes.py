#!/usr/bin/python

import json
from ansible.module_utils.basic import AnsibleModule
import ipaddress

def main():
    fields = {
        "chain_spec_path": {"required": True, "type": "str"},
        "file_content": {"required": False, "type": "str" },
        "network_name": {"required": False, "type": "str" },
        "network_id": {"required": False, "type": "str" },
        "all_nodes": {"required": False, "type": "dict" }
    }
    module = AnsibleModule(argument_spec=fields)
    network_name = module.params["network_name"]
    network_id = module.params["network_id"]
    chain_spec_path = module.params["chain_spec_path"]
    all_nodes = module.params["all_nodes"]

    with open(chain_spec_path) as f:
        data = json.load(f)

    response = {
        "name": f'{network_name}',
        "id": f'{network_id}',
        "protocolId": f'{network_id}'
    }

    boot_node_list = data["bootNodes"]
    for key in all_nodes:
        if "boot" in all_nodes[key]["group_names"]:
            public_key = all_nodes[key]["node_keys_output"]["stdout"]
            try:
                ip = ipaddress.ip_address(key)
                if ip.version == 6:
                    boot_node_list.append(f"/ip6/{key}/tcp/30333/p2p/{public_key}")
                else:
                    boot_node_list.append(f"/ip4/{key}/tcp/30333/p2p/{public_key}")
            except ValueError:
                boot_node_list.append(f"/dns4/{key}/tcp/30333/p2p/{public_key}")

    # telemetry_endpoints = data["telemetryEndpoints"]
    # telemetry_endpoints.append([
    #     "/dns/telemetry.joystream.org/tcp/443/x-parity-wss/%2Fsubmit%2F", 0])

    response["bootNodes"] = boot_node_list
    # response["telemetryEndpoints"] = telemetry_endpoints

    data.update(response)
    with open(chain_spec_path, 'w') as outfile:
        json.dump(data, outfile, indent=4)
    module.exit_json(changed=False, result=response)

if __name__ == '__main__':
    main()
