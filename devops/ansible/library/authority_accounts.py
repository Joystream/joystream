#!/usr/bin/python

from ansible.module_utils.basic import AnsibleModule

def run_module():
    fields = {
        "stash_and_controller_accounts": {"required": True, "type": "list"},
        "all_nodes": {"required": False, "type": "dict" }
    }
    module = AnsibleModule(argument_spec=fields)
    stash_and_controller_accounts = module.params["stash_and_controller_accounts"]
    all_nodes = module.params["all_nodes"]

    authorities = []
    for key in all_nodes:
        if "validators" in all_nodes[key]["group_names"]:
            session_keys = all_nodes[key]["session_keys_output"]["stdout"]
            stash_and_controller = stash_and_controller_accounts.pop()
            authorities.append(stash_and_controller + "," + session_keys)

    response = {
        "accounts": authorities
    }

    module.exit_json(changed=False, result=response)

def main():
    run_module()

if __name__ == '__main__':
    main()
