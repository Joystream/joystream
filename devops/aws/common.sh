get_aws_export () {
  STACK=$1
  PROPERTY=$2
  RESULT=$(aws cloudformation list-exports \
    --profile $CLI_PROFILE \
    --query "Exports[?starts_with(Name,'$STACK$PROPERTY')].Value" \
    --output text | sed 's/\t\t*/\n/g')
  echo -e $RESULT | tr " " "\n"
}
