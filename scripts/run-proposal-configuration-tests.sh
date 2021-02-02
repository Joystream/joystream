#!/usr/bin/env bash


ALL_PROPOSALS_PARAMETERS_JSON=`cat runtime/src/proposals_configuration/sample_proposal_parameters.json` cargo test proposals_configuration::tests -- --ignored

