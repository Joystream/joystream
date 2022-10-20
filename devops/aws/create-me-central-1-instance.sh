#!/usr/bin/env bash

set -e

source common.sh

# Deploy the CloudFormation template
echo -e "\n\n=========== Deploying single node ==========="
aws cloudformation deploy \
  --region me-central-1 \
  --stack-name polkadot-ref-machine-3 \
  --template-file cloudformation/single-instance.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EC2InstanceType=c5d.2xlarge \
    KeyName=mokhtar-joystream-key \
    EC2AMI=ami-0270107dc565af243

