#!/bin/bash

set -e

source common.sh

if [ -z "$1" ]; then
  echo "ERROR: Configuration file not passed"
  echo "Please use ./delete-stack.sh PATH/TO/CONFIG to run this script"
  exit 1
else
  echo "Using $1 file for config"
  source $1
fi

BUCKET_NAME=$(get_aws_export $NEW_STACK_NAME "S3BucketName")

# Delete the CloudFormation stack

echo -e "\n\n=========== Emptying bucket $BUCKET_NAME ==========="

aws s3 rm s3://$BUCKET_NAME --recursive --profile $CLI_PROFILE || echo "No bucket"

echo -e "\n\n=========== Deleting stack $NEW_STACK_NAME ==========="

aws cloudformation delete-stack --stack-name $NEW_STACK_NAME --profile $CLI_PROFILE

echo -e "\n\n=========== Waiting for stack deletion to complete ==========="

aws cloudformation wait stack-delete-complete --stack-name $NEW_STACK_NAME --profile $CLI_PROFILE

echo -e "\n\n=========== Stack $NEW_STACK_NAME deleted ==========="
