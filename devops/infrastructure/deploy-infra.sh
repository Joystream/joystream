#!/bin/bash

STACK_NAME=joystream-node
REGION=us-east-1
CLI_PROFILE=joystream-user
KEY_PATH=""
AWS_KEY_PAIR_NAME=""
BRANCH_NAME=sumer
LOCAL_CODE_PATH="~/Joystream/joystream"
EC2_INSTANCE_TYPE=t2.xlarge
# Set a prebuilt AMI if required
EC2_AMI_ID=""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

NEW_STACK_NAME="${STACK_NAME}-${ACCOUNT_ID}"

# Deploy the CloudFormation template
echo -e "\n\n=========== Deploying main.yml ==========="
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $NEW_STACK_NAME \
  --template-file main.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=$EC2_INSTANCE_TYPE \
    KeyName=$AWS_KEY_PAIR_NAME \
    EC2AMI=$EC2_AMI_ID

# If the deploy succeeded, get the IP, create inventory and configure the created instances
if [ $? -eq 0 ]; then
  aws cloudformation list-exports \
    --profile $CLI_PROFILE \
    --query "Exports[?starts_with(Name,'${NEW_STACK_NAME}PublicIp')].Value" \
    --output text | sed 's/\t\t*/\n/g' > inventory

  sleep 15s

  if [ -z "$EC2_AMI_ID" ]
  then
    echo -e "\n\n=========== Configuring the servers ==========="
    ansible-playbook -i inventory --private-key $KEY_PATH build-code.yml --extra-vars "branch_name=$BRANCH_NAME"
  fi

  echo -e "\n\n=========== Configuring the chain spec file ==========="
  ansible-playbook -i inventory --private-key $KEY_PATH chain-spec-configuration.yml --extra-vars "local_dir=$LOCAL_CODE_PATH"
fi
