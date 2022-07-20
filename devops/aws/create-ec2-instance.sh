#!/usr/bin/env bash

set -e

REGION=us-east-1
CLI_PROFILE=default
# AWS KeyPair name generated during setup
AWS_KEY_PAIR_NAME="mokhtar-joystream-key"
# Full path to the corresponding private key for key name specified above
KEY_PATH="/Users/mokhtar/aws-secrets/mokhtar-joystream-key.pem"
DEFAULT_EC2_INSTANCE_TYPE=c4.2xlarge
STACK_NAME=temp-ami-creation

source common.sh

if [ ! -f "$KEY_PATH" ]; then
    echo "Key file not found at $KEY_PATH"
    exit 1
fi

# Deploy the CloudFormation template
echo -e "\n == Creating EC2 Instance =="
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $STACK_NAME \
  --template-file cloudformation/single-instance-ami-base.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=$DEFAULT_EC2_INSTANCE_TYPE \
    KeyName=$AWS_KEY_PAIR_NAME

# If the deploy succeeded, get the IP and configure the created instance
if [ $? -eq 0 ]; then
  # Install additional Ansible roles from requirements
  ansible-galaxy install -r requirements.yml

  SERVER_IP=$(get_aws_export $STACK_NAME "PublicIp")
  INSTANCE_ID=$(get_aws_export $STACK_NAME "InstanceId")

  echo -e "New Node PublicIp: $SERVER_IP"
  echo -e "New Node InstanceId: $INSTANCE_ID"
exit 0

# Run some playbook on the instance
ansible-playbook -i $SERVER_IP, \
  create-joystream-node-ami-playbook.yml \
  --extra-vars "branch_name=carthage-playground git_repo=https://github.com/joystream/joystream \
     ami_name=carthage-playground-ami-2 \
     instance_id=i-074e7495c41a2140e \
     runtime_profile='' "

else
  echo "Deploy Failed"
fi
