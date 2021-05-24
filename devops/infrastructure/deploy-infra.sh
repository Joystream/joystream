#!/bin/bash

source bash-config.cfg

ACCOUNT_ID=$(aws sts get-caller-identity --profile $CLI_PROFILE --query Account --output text)

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

  if [ -z "$EC2_AMI_ID" ]
  then
    echo -e "\n\n=========== Configuring the servers ==========="
    ansible-playbook -i inventory --private-key $KEY_PATH build-code.yml --extra-vars "branch_name=$BRANCH_NAME"
  fi

  echo -e "\n\n=========== Configuring the chain spec file ==========="
  ansible-playbook -i inventory --private-key $KEY_PATH chain-spec-configuration.yml \
    --extra-vars "local_dir=$LOCAL_CODE_PATH network_suffix=$NETWORK_SUFFIX data_path=data-$NEW_STACK_NAME"
fi
