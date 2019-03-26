<p align="center"><img width=200px src="testnet-placeholder-logo.svg"></p>
<p align="center"><img src="testnet-placeholder-headline.svg"></p>

<div align="center">
  <h3>
    <a href="#">
      Specification
    </a>
    <span> | </span>
    <a href="#">
      OKRs
    </a>
    <span> | </span>
    <a href="#">
      Products
    </a>
    <span> | </span>
    <a href="#">
      Milestones
    </a>
  </h3>
</div>

# Table of contents

- [Overview](#overview)
- [Release Meetings](#release-meetings)
- [Specification](#specification)
- [GitHub Projects](#github-projects)
- [OKR results](#okr-results)
- [Release Plan](#release-plan)
  - [Manager](#manager)
  - [Release Date](#release-date)
  - [OKRs](#okrs)
  - [Constraints](#constraints)
  - [Risks](#risks)
  - [Deployment](#deployment)
  - [Specification Plans](#specification-plans)
  - [Products](#products)
  - [Events](#events)
  - [Go-To-Market](#go-to-market)
    - [Paid Roles](#paid-roles)
    - [Tutorials](#tutorials)
    - [Messages](#messages)
  - [Public Infrastructure](#public-infrastructure)
  - [Internal Infrastructure and Tools](#internal-infrastructure-and-tools)
  - [Internal Operations](#internal-operations)
  - [Milestones](#milestones)

# Overview

Athens is the third Joystream testnet, and it is scheduled for release

### `Date`, `Time` (`Time Zone`)

# Release Meetings

| Date            | Link          |
| -------------   | ------------- |
| NA              | x              |

#  Specification

[Specification](...)

# GitHub Projects

The current set of relevant GitHub projects are

- [X Release](https://github.com/orgs/Joystream/projects/X)

# OKR results

Will be available on measurement deadline, will be done by

- **`Name`**

# Release Plan

`A release plan is a planning document used in a process, her, its not meant to be kept in synch with ongoing efforts after this initial planning stage.`

## Manager

**`Name`**

## Release Date

`Date`, `Time` (`Time Zone`)

## OKRs

### Objective: `objective`
- **KR Measurement Deadline**: 1 week after  launch
- **Key Results**:
#### 1. `...`

## Constraints

`List of constraints`

## Risks

`List of risks`

## Specification Plans

`Whether there is going to be a separate spec`

## Deployment

`How to do upgrade, specifically on-chain upgrade of runtime, with or without migration, or new genesis block and thus network`

## Products

The following public products will be part of this release.

### Runtime
---
- **Description:** Runtime for Validator node
- **Manager:** <span style="color:blue">Mokhtar</span>
- **Core Team:**
  - `Name of person`: `Role`
- **Main repo:** [`repo name`](...)
- **Current version:** `..`
- **New version:** `..`
- **Audit:** `..`
- **Documentation:** `..`
- **Legal Review/ToS update:** `..`
- **Build/CI system:**
  - <span style="color:blue">Jaydip</span>: Get CI builds for runtime
- **Target Platforms:** NO CHANGE
- **New/Altered Functionality:**
  - <span style="color:blue">Mokhtar</span>: Basic membership system:
    - `...`
- **Refactor/Reorganization:**
  - Split the runtime into its own repo, and include a docker script for doing
reproducible builds. Will be needed for testing/verifying runtime upgrade
proposals, and first use will be for this next release
- **New Key User Stories:** NONE
- **Deployment/Distribution:**
    - Will be voted in through an upgrade proposal in council, see Events section for how.


## Events

### Athens Runtime Testnet

- **Description:** We conduct an actual testnet with ourselves and key community members as
participants.
- **Deadline:** 29. March
- **Manager:** <span style="color:blue">Martin</span>
- **Team:**
  - <span style="color:blue">Mokhtar</span>: Developer
  - <span style="color:blue">Jaydip</span>: DevOps
- **Test specification:**
  - <span style="color:red">Please rewrite more clearly</span>


## Go-To-Market

### Paid Roles

- **Description:** During the lifetime of the testnet, until next upgrade or network or discretionary
announcement, the following incentive campaign is in place to achieve key results for service
providers. Policy would be
  - Validator: 30$ per week -> 0.03C per block
  - Council Member: 5$ for seat, 5$ for vote
  - Storage: $0.1/GB per day (depends on whether anyone can upload)
- **Manager:** <span style="color:blue">Martin</span>
- **Team:**
  - <span style="color:blue">Martin</span>: Manager
  - <span style="color:blue">Bedeho</span>: ElPassion Manager
  - <span style="color:blue">Mokhtar</span>: Developer
  - <span style="color:blue">Tomasz</span>: Designer
  - <span style="color:blue">Jaydip</span>: Community manager/Devops
- **Tasks:**
  - <span style="color:blue">Bedeho</span>, <span style="color:blue">Tomasz</span>: Update Joystream.org with new testnet summary information
   - New fields about new state
     - Number of members (perhaps even actual names?)
     - Number of storage providers
     - Total amount of storage used
     - Total amount of content items published
   - Better representation about election cycle system, more clearly need to represent the multistaged nature, with a countdown to act, and perhaps why, and also a CTA to actually act.
   - New list of roles, with active ones emphasied
   - New section for next testnet, with state there <== needs name
  - <span style="color:blue">Mokhtar</span>: Update backend infrastructure to support new life Athens web based summary
  - <span style="color:blue">Martin</span>: Update or write tutorials for how to participate in roles on Github
    - Validator (systemd setup, fine tuning linux, inspiration: https://kb.certus.one/)
    - Storage Provider
  - <span style="color:blue">Martin</span>: Write & publish blog posts
    - [Runtime upgrades vs forks](runtime-upgrades-vs-forks)
    - [Announcing Athens Testnet](announcing-athens-testnet)
    - [Athens Incentive Structure](athens-incentive-structure)
    - [Athens Released](athens-released)
  - <span style="color:blue">Jaydip</span>: Tech support/online presence
    - Monitor tlgrm, RC, (after trust established, twtr and reddit?)

### Tutorials

#### How to be a Validator

- **Description:** Step by step guide for how to setup and run a validator node, and claim reward
- **CTA:** Go and setup your node
- **Author:** <span style="color:blue">Martin</span>
- **Distribution:** Github?
- **Assets:** NONE

## Public Infrastructure

### Hosted Joystream Pioneer

- **Description:** Host a version of Joystream Pioneer on joystream.org + others?
- **Manager:** <span style="color:blue">Jaydip</span>
- **DevOps:** <span style="color:blue">Jaydip</span>
- **Repo:** Aim for static build of pioneer repo (similar to polkadot-js apps deploymnet)
- **Team:**
  - <span style="color:blue">Jaydip</span>
- **Tasks:**
  - Reuse existing linode server or deploy to heroku for example (autodeploy o master branch merge)?


## Internal Infrastructure and Tools

### Payout Tool

- **Description:** Tool to compute payouts to relevant parties on testnet
- **Manager:** <span style="color:blue">Martin</span>
- **Repo (private):** [testnet-payout-scripts](https://github.com/Joystream/testnet-payout-scripts)
- **Team:**
  - <span style="color:blue">Martin</span>
- **Tasks:**
  - Update to cover storage providers

## Internal Operations

### Payouts

- **Description:** Conduct regular payouts
- **Manager:** <span style="color:blue">Martin</span>
- **Team:**
  - <span style="color:blue">Martin</span>
- **Schedule:**
  - Storage and Validator get payouts every fifth day
  - Counil gets one time payout after council upgrade

### Support

- **Description:** Provide support to users enaging with testnet functionality and campaigns
- **Manager:** <span style="color:blue">Jaydip</span>
- **Team:**
  - <span style="color:blue">Jaydip</span>
  - <span style="color:blue">Martin</span>
- **Duration:**
  - Very high availability in the week following releases
  - No more than 24 hour lag in response to queries after that
- **Channels:**
  - Telegram
  - Reddit
  - RocketChat

## Milestones

1. `...`
2. `...`
