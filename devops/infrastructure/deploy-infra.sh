#!/bin/bash

STACK_NAME=joystream-node
REGION=us-east-1
CLI_PROFILE=joystream-user
KEY_PATH="./joystream-key.pem"

BRANCH_NAME=sumer

LOCAL_CODE_PATH="~/Joystream/joystream"

EC2_INSTANCE_TYPE=t2.xlarge

# Deploy the CloudFormation template
echo -e "\n\n=========== Deploying main.yml ==========="
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $STACK_NAME \
  --template-file main.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=$EC2_INSTANCE_TYPE

# If the deploy succeeded, get the IP, create inventory and configure the created instances
if [ $? -eq 0 ]; then
  aws cloudformation list-exports \
    --profile $CLI_PROFILE \
    --query "Exports[?starts_with(Name,'${STACK_NAME}PublicIp')].Value" \
    --output text | sed 's/\t\t*/\n/g' > inventory

  echo -e "\n\n=========== Configuring the servers ==========="
  ansible-playbook -i inventory -v --private-key $KEY_PATH build-code.yml --extra-vars "branch_name=$BRANCH_NAME"

  echo -e "\n\n=========== Configuring the chain spec file ==========="
  ansible-playbook -i inventory -v --private-key $KEY_PATH chain-spec-configuration.yml --extra-vars "local_dir=$LOCAL_CODE_PATH"
fi
