#!/usr/bin/env bash

set -e

# Delete the CloudFormation stack

echo -e "\n\n=========== Deleting stack $STACK_NAME ==========="

aws cloudformation delete-stack --stack-name $STACK_NAME --profile $CLI_PROFILE

echo -e "\n\n=========== Waiting for stack deletion to complete ==========="

aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --profile $CLI_PROFILE

echo -e "\n\n=========== Stack $STACK_NAME deleted ==========="
