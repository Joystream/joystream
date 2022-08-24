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

let TotalNumberOfInstancesInGroups=$NUMBER_OF_VALIDATORS+$NUMBER_OF_STORAGE_NODES+$NUMBER_OF_DISTRIBUTOR_NODES

# Deploy the CloudFormation template
echo -e "Deploying AWS Resources"
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $STACK_NAME \
  --template-file cloudformation/infrastructure.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=$DEFAULT_EC2_INSTANCE_TYPE \
    ValidatorEC2InstanceType=$VALIDATOR_EC2_INSTANCE_TYPE \
    RPCEC2InstanceType=$RPC_EC2_INSTANCE_TYPE \
    BuildEC2InstanceType=$BUILD_EC2_INSTANCE_TYPE \
    KeyName=$AWS_KEY_PAIR_NAME \
    JoystreamAmi=$JOYSTREAM_AMI \
    NumberOfValidators=$NUMBER_OF_VALIDATORS \
    NumberOfStorageNodes=$NUMBER_OF_STORAGE_NODES \
    NumberOfDistributorNodes=$NUMBER_OF_DISTRIBUTOR_NODES \
    TotalNumberOfInstancesInGroups=$TotalNumberOfInstancesInGroups \
    VolumeSize=$VOLUME_SIZE

# Install additional Ansible roles from requirements
ansible-galaxy install -r requirements.yml

ASG=$(get_aws_export $STACK_NAME "ValidatorsGroup")
VALIDATORS=""
INSTANCES=$(aws autoscaling describe-auto-scaling-instances --profile $CLI_PROFILE \
  --query "AutoScalingInstances[?AutoScalingGroupName=='${ASG}'].InstanceId" --output text);
for ID in $INSTANCES
do
  IP=$(aws ec2 describe-instances --instance-ids $ID --query "Reservations[].Instances[].PublicIpAddress" --profile $CLI_PROFILE --output text)
  VALIDATORS+="$IP\n"
done

ASG=$(get_aws_export $STACK_NAME "StorageNodesGroup")
STORAGE_NODES=""
INSTANCES=$(aws autoscaling describe-auto-scaling-instances --profile $CLI_PROFILE \
  --query "AutoScalingInstances[?AutoScalingGroupName=='${ASG}'].InstanceId" --output text);
for ID in $INSTANCES
do
  IP=$(aws ec2 describe-instances --instance-ids $ID --query "Reservations[].Instances[].PublicIpAddress" --profile $CLI_PROFILE --output text)
  STORAGE_NODES+="$IP\n"
done

ASG=$(get_aws_export $STACK_NAME "DistributorNodesGroup")
DISTRIBUTOR_NODES=""
INSTANCES=$(aws autoscaling describe-auto-scaling-instances --profile $CLI_PROFILE \
  --query "AutoScalingInstances[?AutoScalingGroupName=='${ASG}'].InstanceId" --output text);
for ID in $INSTANCES
do
  IP=$(aws ec2 describe-instances --instance-ids $ID --query "Reservations[].Instances[].PublicIpAddress" --profile $CLI_PROFILE --output text)
  DISTRIBUTOR_NODES+="$IP\n"
done

RPC_NODE=$(get_aws_export $STACK_NAME "RPCPublicIp")
BUILD_SERVER=$(get_aws_export $STACK_NAME "BuildPublicIp")
BUILD_INSTANCE_ID=$(get_aws_export $STACK_NAME "BuildInstanceId")

mkdir -p $DATA_PATH

echo -e "
  [build]
  $BUILD_SERVER

  [validators]
  $VALIDATORS

  [rpc]
  $RPC_NODE

  [storage]
  $STORAGE_NODES

  [distribution]
  $DISTRIBUTOR_NODES
" > $INVENTORY_PATH

# Build binaries and packages if no pre-built AMI was specified
if [ -z "$JOYSTREAM_AMI" ]
then
  echo -e "\n\n=========== Compile joystream-node on build server ==========="
  ansible-playbook -i $INVENTORY_PATH --private-key $KEY_PATH build-code.yml \
    --extra-vars "branch_name=$BRANCH_NAME git_repo=$GIT_REPO build_local_code=$BUILD_LOCAL_CODE
                  data_path=$DATA_PATH runtime_profile=$RUNTIME_PROFILE"
fi

echo -e "\n\n=========== Configure and start validators, rpc node, and query node ==========="
ansible-playbook -i $INVENTORY_PATH --private-key $KEY_PATH configure-network.yml \
  --extra-vars "local_dir=$LOCAL_CODE_PATH network_name=$NETWORK_NAME
                data_path=$DATA_PATH
                deployment_type=$DEPLOYMENT_TYPE
                initial_balances_file=$INITIAL_BALANCES_PATH
                initial_members_file=$INITIAL_MEMBERS_PATH
                number_of_validators=$NUMBER_OF_VALIDATORS
                number_of_storage_nodes=$NUMBER_OF_STORAGE_NODES
                number_of_distributor_nodes=$NUMBER_OF_DISTRIBUTOR_NODES
                endow_accounts=$ENDOW_ACCOUNTS
                "

echo -e "\n\n=========== Delete Build instance ==========="
DELETE_RESULT=$(aws ec2 terminate-instances --instance-ids $BUILD_INSTANCE_ID --profile $CLI_PROFILE)
echo $DELETE_RESULT
