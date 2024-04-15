#!/bin/sh

# Run for T seconds
T=60

# Pass the endpoint as the first argument, default to local
endpoint=${1:-'http://localhost:8081/graphql'}

invalidWhen=".errors != null or (.data.proposals | length == 0)"
query=$(
  cat <<EOF | awk '{ print NR == 1 ? "" : "\\n" } 1' ORS=''
{"query":"{
  proposals (
    # Check filter/order performance too
    where: { status_json: { isTypeOf_eq: \"ProposalStatusExecuted\" } }
    orderBy: createdAt_DESC
  ) {
    id
    createdInEvent { id inBlock }
    status { __typename }
    creator {
      createdAt
      referredMembers { id }
      proposalvotedeventvoter {
        id
        inBlock
      }
    }
    proposalStatusUpdates {
      type
    }
    votes {
      inBlock
      voteKind
      rationale
    }
  }
}"}
EOF
)

SEC=1000000000
i=-1

until=$(($(date +%s%N) + $T * $SEC))
while [ $(date +%s%N) -lt $until ]; do
  i=$((i + 1))
  res=$(curl -s "$endpoint" -H 'Content-Type: application/json' --data-binary "$query")
  if $(echo "$res" | jq -e "$invalidWhen"); then
    echo "Failed with response $res"
    exit 1
  fi
done

echo "Sent $i queries in $T seconds"
