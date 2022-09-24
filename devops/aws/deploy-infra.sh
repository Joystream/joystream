#!/usr/bin/env bash

set -e

source common.sh

if [ -z "$1" ]; then
  echo "ERROR: Configuration file not passed"
  echo "Please use ./deploy-infra.sh PATH/TO/CONFIG to run this script"
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
echo -e "Deploying AWS Resources"
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $STACK_NAME \
  --template-file cloudformation/network.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=$EC2_INSTANCE_TYPE \
    KeyName=$AWS_KEY_PAIR_NAME \
    VolumeSize=$VOLUME_SIZE

VAL1=$(get_aws_export $STACK_NAME "Val1PublicIp")
VAL2=$(get_aws_export $STACK_NAME "Val2PublicIp")
VAL3=$(get_aws_export $STACK_NAME "Val3PublicIp")
RPC_NODE=$(get_aws_export $STACK_NAME "RpcPublicIp")
BUILD_SERVER=$(get_aws_export $STACK_NAME "BuildPublicIp")

mkdir -p $DATA_PATH

echo -e "
[build]
$BUILD_SERVER

[validators]
$VAL1
$VAL2
$VAL3

[rpc]
$RPC_NODE
" > $INVENTORY_PATH

# Build binaries and packages
echo -e "\n\n=========== Install Developer Tools ==========="
ansible-playbook -i $INVENTORY_PATH --private-key $KEY_PATH ../ansible/install-tools.yml

echo -e "\n\n=========== Build Apps & Binaries ==============="
ansible-playbook -i $INVENTORY_PATH --private-key $KEY_PATH ../ansible/build-code.yml \
  --extra-vars "branch_name=$BRANCH_NAME git_repo=$GIT_REPO build_local_code=$BUILD_LOCAL_CODE
                runtime_profile=$RUNTIME_PROFILE"

echo -e "\n\n======= Fetching binaries from Build server ======"
ansible-playbook -i $INVENTORY_PATH --private-key $KEY_PATH ../ansible/fetch-binaries.yml \
  --extra-vars "data_path=$DATA_PATH"

echo -e "\n\n=========== Delete Build instance ==========="
BUILD_INSTANCE_ID=$(get_aws_export $STACK_NAME "BuildInstanceId")
DELETE_RESULT=$(aws ec2 terminate-instances --instance-ids $BUILD_INSTANCE_ID --profile $CLI_PROFILE)
echo $DELETE_RESULT

echo -e "\n\n========== Configure And Start Network ==========="
ansible-playbook -i $INVENTORY_PATH --private-key $KEY_PATH ../ansible/deploy-network.yml \
  --extra-vars "network_name='$NETWORK_NAME'
                network_id=$NETWORK_ID
                data_path=$DATA_PATH
                deployment_type=$DEPLOYMENT_TYPE
                initial_balances_file=$INITIAL_BALANCES_PATH
                endow_accounts=$ENDOW_ACCOUNTS
                "
