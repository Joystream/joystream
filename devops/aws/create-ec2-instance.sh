#!/usr/bin/env bash

set -e

REGION=us-east-1
CLI_PROFILE=default
# AWS KeyPair name generated during setup
AWS_KEY_PAIR_NAME="mokhtar-joystream-key"
# Full path to the corresponding private key for key name specified above
KEY_PATH="/Users/mokhtar/aws-secrets/mokhtar-joystream-key.pem"
DEFAULT_EC2_INSTANCE_TYPE=c4.2xlarge
STACK_NAME=mokhtar-temp

source common.sh

if [ ! -f "$KEY_PATH" ]; then
    echo "Key file not found at $KEY_PATH"
    exit 1
fi

# Deploy the CloudFormation template
echo -e "\n == Creating Stack =="
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

# If the deploy succeeded, get the IP
if [ $? -eq 0 ]; then
  SERVER_IP=$(get_aws_export $STACK_NAME "PublicIp")
  echo -e "New Node PublicIp: $SERVER_IP"
else
  echo "Deploy Failed"
fi
