#!/usr/bin/python

from ansible.module_utils.basic import *
import json


def main():
    fields = {
        "change_spec_path": {"required": True, "type": "str"},
        "file_content": {"required": False, "type": "str" },
        "prefix": {"required": False, "type": "str" },
        "all_nodes": {"required": False, "type": "dict" },
        # "description": {"required": False, "type": "str"},
        # "private": {"default": False, "type": "bool" },
        # "state": {
        # 	"default": "present", 
        # 	"choices": ['present', 'absent'],  
        # 	"type": 'str' 
        # },
    }
    module = AnsibleModule(argument_spec=fields)
    prefix = module.params["prefix"]
    change_spec_path = module.params["change_spec_path"]
    all_nodes = module.params["all_nodes"]

    with open(change_spec_path) as f:
        data = json.load(f)
    # data = json.loads(module.params["file_content"])
    # print(data)
    # response = {"hello": "world"}
    response = {
        "name": f'{data["name"]} {prefix}',
        "id": f'{data["id"]}_{prefix}',
        "protocolId": f'{data["protocolId"]}{prefix}'
    }

    boot_node_list = data["bootNodes"]
    for key in all_nodes:
        public_key = all_nodes[key]["subkey_output"]["stderr"]
        boot_node_list.append(f"/ip4/{key}/tcp/30333/p2p/{public_key}")

    response["bootNodes"] = boot_node_list

    data.update(response)
    with open(change_spec_path, 'w') as outfile:
        json.dump(data, outfile, indent=4)
    module.exit_json(changed=False, result=response)

if __name__ == '__main__':
    main()
