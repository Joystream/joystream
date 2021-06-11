#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "ERROR: Configuration file not passed"
  echo "Please use ./deploy-infra.sh PATH/TO/CONFIG to run this script"
  exit 1
else
  echo "Using $1 file for config"
  source $1
fi

if [ $ACCOUNT_ID == None ]; then
    echo "Couldn't find Account ID, please check if AWS Profile $CLI_PROFILE is set"
    exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
    echo "Key file not found at $KEY_PATH"
    exit 1
fi

# # Deploy the CloudFormation template
echo -e "\n\n=========== Deploying single instance ==========="
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $NEW_STACK_NAME \
  --template-file single-instance.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=$DEFAULT_EC2_INSTANCE_TYPE \
    KeyName=$AWS_KEY_PAIR_NAME \
    EC2AMI=$EC2_AMI_ID

# If the deploy succeeded, get the IP and configure the created instance
if [ $? -eq 0 ]; then
  # Install additional Ansible roles from requirements
  ansible-galaxy install -r requirements.yml

  SERVER_IP=$(get_aws_export "PublicIp")

  echo -e "New Node Public IP: $SERVER_IP"

  echo -e "\n\n=========== Configuring the chain spec file and Pioneer app ==========="
  ansible-playbook -i $SERVER_IP, --private-key $KEY_PATH new-node-playbook.yml \
    --extra-vars "binary_file=$BINARY_FILE chain_spec_file=$CHAIN_SPEC_FILE"
fi
