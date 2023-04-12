#!/usr/bin/env bash

set -e

source common.sh

if [ -z "$1" ]; then
  echo "ERROR: Configuration file not passed"
  echo "Please use ./deploy-playground.sh PATH/TO/CONFIG to run this script"
  exit 1
else
  echo "Using $1 file for config"
  source $1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile $CLI_PROFILE --query Account --output text)

if [ $ACCOUNT_ID == None ]; then
    echo "Couldn't find Account ID, please check if AWS Profile $CLI_PROFILE is set"
    exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
    echo "Key file not found at $KEY_PATH"
    exit 1
fi

# Install additional Ansible roles from requirements
ansible-galaxy install -r ../ansible/requirements.yml

# Deploy the CloudFormation template
echo -e "\n\n=========== Deploying Playground Node ==========="
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $STACK_NAME \
  --template-file cloudformation/single-instance.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=$DEFAULT_EC2_INSTANCE_TYPE \
    KeyName=$AWS_KEY_PAIR_NAME

# If the deploy succeeded, get the IP and configure the created instance
if [ $? -eq 0 ]; then
  SERVER_IP=$(get_aws_export $STACK_NAME "PublicIp")

  echo -e "New Node Public IP: $SERVER_IP"

  echo -e "\n\n=========== Configuring node ==========="
  ansible-playbook -i $SERVER_IP, --private-key $KEY_PATH ../ansible/deploy-playground-playbook.yml \
    --extra-vars "branch_name=$BRANCH_NAME git_repo=$GIT_REPO skip_chain_setup=$SKIP_CHAIN_SETUP
                  stack_name=$STACK_NAME runtime_profile=$RUNTIME_PROFILE
                  ssh_pub_key='${SSH_PUB_KEY}'
                  treasury_suri='${TREASURY_SURI}'
                  initial_balances='${INITIAL_BALANCES}'
                  init_chain_scenario='${INIT_CHAIN_SCENARIO}'"
fi
