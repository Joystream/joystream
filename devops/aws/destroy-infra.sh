#!/bin/bash

set -e

source common.sh

if [ -z "$1" ]; then
  echo "ERROR: Configuration file not passed"
  echo "Please use ./destroy-infra.sh PATH/TO/CONFIG to run this script"
  exit 1
else
  echo "Using $1 file for config"
  source $1
fi

# Delete the CloudFormation stack

echo -e "\n\n=========== Deleting stack $NEW_STACK_NAME ==========="

aws cloudformation delete-stack --stack-name $NEW_STACK_NAME --profile $CLI_PROFILE

echo -e "\n\n=========== Waiting for stack deletion to complete ==========="

aws cloudformation wait stack-delete-complete --stack-name $NEW_STACK_NAME --profile $CLI_PROFILE

echo -e "\n\n=========== Stack $NEW_STACK_NAME deleted ==========="
