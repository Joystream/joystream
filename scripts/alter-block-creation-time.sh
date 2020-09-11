#!/bin/bash

perl -i -pe's/pub const MILLISECS_PER_BLOCK: Moment = 6000;/pub const MILLISECS_PER_BLOCK: Moment = 2000;/' runtime/src/constants.rs
perl -i -pe's/pub const SLOT_DURATION: Moment = 6000;/pub const SLOT_DURATION: Moment = 2000;/' runtime/src/constants.rs
