<img src="acropolis-cover.svg"/>

<div align="center">
  <h3>
    <a href="#">
      Specification
    </a>
  </h3>
</div>

# Table of contents

- [Live Milestones](#live-milestones)
- [Past Release Meetings](#past-release-meetings)
- [Specification](#specification)
- [GitHub Projects](#github-projects)
- [OKR results](#okr-results)
- [Release Plan](#release-plan)
  - [Name](#name)
  - [Manager](#manager)
  - [Release Date](#release-date)
  - [OKRs](#okrs)
  - [Constraints](#constraints)
  - [Risks](#risks)
  - [Deployment](#deployment)
  - [Specification Plans](#specification-plans)
  - [Products](#products)
    - [Runtime](#runtime)
    - [Joyful](#joyful)
    - [Colossus](#colossus)
    - [Pioneer](#pioneer)
  - [Milestones](#milestones)
    - [Acropolis Runtime Testnet](#acropolis-runtime-testnet)
    - [Runtime Upgrade](#runtime-upgrade)
  - [Go-To-Market](#go-to-market)
    - [Paid Roles](#paid-roles)
    - [Helpdesk](#helpdesk)
    - [Messages](#messages)
      - [Runtime upgrades vs forks](#runtime-upgrades-vs-forks)
      - [Announcing Acropolis Testnet](#announcing-acropolis-testnet)
      - [Acropolis Incentive Structure](#acropolis-incentive-structure)
      - [Acropolis Released](#acropolis-released)
  - [Public Infrastructure](#public-infrastructure)
  - [Internal Infrastructure and Tools](#internal-infrastructure-and-tools)
  - [Internal Operations](#internal-operations)
  - [Milestones](#milestones)

# Live Milestones

WIP


#### Actual dates:

- **TBD**



# Past Release Meetings

| Name/category   | Date            | Link                              |
| :-------------: | :-------------: |:-------------------------------------:|
| Launch Meeting  | 26.04.19        | ../meetings/acropolis/#launch-meeting

#  Specification

TBD.

# GitHub Projects

The current set of relevant GitHub projects are

- [Acropolis Release](https://github.com/orgs/Joystream/projects/7)

# OKR results

NA.

# Release Plan

**This plan was made once, but is not kept in synch with ongoing efforts and adjustments.**

## Name

`Acropolis`

## Manager

`Martin`

## Release Date

6 June 2019, 12:00 (GMT+1)

## OKRs
WIP

# Release OKRs
### Objective: `Launch Acropolis Network`
- **Active from:** 29.04.19
- **KR Measurement Deadline**: 7-9 days after Acropolis launch (first weekday)
- **Tracked**: Every Monday
- **Tracking Manager**: Martin
- **Key Results**:
1. `Get 200 posts on forum (limits, not Jsg) (ewd)`
2. `All n* modules fully specd (n)`   
3. `Add tranches to storage-node (ewd)`
4. `No PRs merged to master (excluding bugfixes and "pioneer") after "Module Test" (ewd)`

`* Bedeho to define n, n_m, n_a, n_j, n_b`

Go [here](../okrs/#release-okrs) for more details and tracking.

## Constraints

WIP

- Delays and post-work following the [Athens](../testnets/athens) release has lead to delays on this release plan.

## Risks


## Specification Plans

Yes.

## Deployment

On-chain upgrade of runtime, no migration.

## Products

The following public products will be part of this release.

### Runtime
---
- **Description:** Runtime for Validator node
- **Manager:** **Mokhtar**
- **Core Team:**
  - **Mokhtar:** Developer
  - **Alex:** Developer
  - **Jens:** Developer
  - **Martin:** Testing
  - **Bedeho:** Developer
- **Main repo:** [substrate-runtime-joystream](https://github.com/Joystream/substrate-runtime-joystream)
- **Current version:** *FILL IN*
- **New version:** *FILL IN*
- **Audit:** *FILL IN*
- **Documentation:** *FILL IN*
- **Legal Review/ToS update:** *FILL IN*
- **Build/CI system:**
  - **NN:** *FILL IN*
- **Target Platforms:** *FILL IN*
- **New/Altered Functionality:**
    * *FILL IN*
- **Refactor/Reorganization:**
  - Split the runtime into its own repo, *and include a docker script for doing
reproducible builds. Will be needed for testing/verifying runtime upgrade
proposals, and first use will be for this next release*
- **New Key User Stories:** *FILL IN*
- **Deployment/Distribution:**
    - Will be voted in through an upgrade proposal in council, see Events section for how.

### Joyful
---

- **Description:** Validator node. (No change?)
- **Manager:** **Mokhtar**
- **Team:**
  - **Mokhtar:** Developer
  - **Martin:** Testing
  - ***FILL IN***: Devops
- **Main repo:** [substrate-node-joystream](https://github.com/Joystream/substrate-node-joystream)
- **Current version:** v1.0
- **New version:** *FILL IN*
- **Audit:** NO
- **Documentation:** *FILL IN*
- **Legal Review/ToS update:** *FILL IN*
- **Build/CI system:** *FILL IN*
- **Target Platforms:**
  - *FILL IN*
- **New/Altered Functionality:**
  - *FILL IN*
- **New Key User Stories:** *FILL IN*
- **Deployment/Distribution:**
  - *FILL IN*
  - **Devops:**
    - *FILL IN*

### Colossus
---
- **Description:** Combined storage and distribution node.
- **Manager:** Jens
- **Team:**
  - **Jens:** Developer
  - *FILL IN* Developer
  - **Martin:** Testing
- **Main repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Current version:** *FILL IN*
- **New version:** *FILL IN*
- **Audit:** *FILL IN*
- **Documentation:** *FILL IN*
- **Legal Review/ToS update:** *FILL IN*
- **Build/CI system:** *FILL IN*
- **Target Platforms:** *FILL IN*
- **New/Altered Functionality:** Jens
  - *FILL IN*
- **New Key User Stories:**
  - *FILL IN*
- **Deployment/Distribution:**
  - *FILL IN*

### Pioneer
---
 - **Description:** The user interface for interacting with the platform.
 - **Manager:** Alex
 - **Team:**
  - **Alex:** Developer
  - **Mokhtar:** Developer
  - **Martin:** Testing
 - **Main repo:** [apps](https://github.com/Joystream/apps)
 - **Current version:** *FILL IN*
 - **New version:** *FILL IN*
 - **Audit:** *FILL IN*
 - **Documentation:** *FILL IN*
 - **Legal Review/ToS update:** *FILL IN*
 - **Build/CI system:** *FILL IN*
 - **Target Platforms:** *FILL IN*
 - **New/Altered Functionality**: Alex
  - *FILL IN*
 - **New User Stories:**
  - *FILL IN*
 - **Deployment/Distribution:**
 - *FILL IN*

## Milestones

| Date            |   Event                               |     Involved                            |
| :--------------:|:-------------------------------------:|:---------------------------------------:|
|    29.05.19     | [Module Test](#module-test)           | All                                     |
|    03.06.19     | [Final Test](#final-test)             | Martin, Mokhtar + 2x community members  |
|    04.06.19     | [Runtime Proposal](#runtime-proposal) | Mokhtar, Martin                         |
|    06.06.19     | [Release](#release)                   | All                                     |


### Module Test

- **Description:** Test all modules separately on the staging testnet
- **Deadline:** 29. May
- **Manager:** **Martin**
- **Team:**
  - **Mokhtar:** Test guide for all modules/software under his responsibility
  - **Alex:** Test guide for all modules/software under his responsibility
  - **Jens:** Test guide for all modules/software under his responsibility
  - **Bedeho:** Test guide for all modules/software under his responsibility
- **Test specification:**
  - All developers must demonstrate full functionality of their module/software. Runtime should be completed.
      1. with a working branch of Pioneer (compatible with Athens, _must_ not include rest of Acropolis scope)
      2. any other supporting software (compatible with Athens, _must_ not include rest of Acropolis scope)
      3. if applicable, present clear list of items outstanding with:
          - dependencies / responsible person(s)
          - realistic timeline
          - what, if any, should be postponed/abandoned for late release or next release.
          - note that both RM and developer are responsible for this list not coming as a surprise.

**Note** After this test, only bugfix PRs can be merged to master branch of relevant repos.

### Final Test

- **Description:** Upgrade staging testnet runtime to "Acropolis", and perform a full feature test.
- **Deadline:** 03. June
- **Manager:** **Mokhtar**
- **Team:**
  - **Martin:** Lead tester
  - **Community Member 1:** Tester
  - **Community Member 2:** Tester
- **Time line:**
  - A full test of all features and cycles on the platform with Acropolis runtime. Participants must use different OS' and browsers, for joystream-node, storage-nodes and pioneer.

### Runtime Proposal

- **Description:** Make `proposal` for a new runtime with the `sudo.key`.
- **Deadline:** 04. June 13:00GMT
- **Manager:** **Mokhtar**
- **Team:**
  - **Martin:** Reach out to council member, promote voting, and prepare final blog/newsletter for Acropolis.
- **Time line:** After the runtime upgrade proposal is submitted, the actual upgrade will happen 48h later.

### Release
- **Description:** If proposal does not reach quorum, without legitimate criticism, immediately force the new proposal with the `sudo.key`. To avoid having the runtime upgrade happen before that time, Martin and Mokhtar will hold their vote until 10 blocks before the voting period expires.
- **Deadline:** 06. June 13:00GMT
- **Manager:** **Mokhtar**

---

## Go-To-Market

**Note**
Reference to a date or a [milestone](#milestones) should be referenced to each of these items.

### Paid Roles

- **Description:** During the lifetime of the testnet, until next upgrade or network or discretionary
announcement, the following incentive campaign is in place to achieve key results for service
providers. Policy would be
  - *FILL IN*
- **Manager:** **Martin**
- **Team:**
  - **Martin:** Manager
  - **Bedeho:** ElPassion Manager
  - **Mokhtar:** Developer
  - **Tomasz:** Designer
  - *FILL IN* Community manager/Devops
- **Tasks:**
  - **Bedeho**, **Tomasz:** Update Joystream.org with new testnet summary information
    - *FILL IN*
  - **Mokhtar:** *FILL IN*
  - **Martin:** *FILL IN*
  - **Martin:** Write & publish blog posts
      - *FILL IN*
  - **FILL IN:** Tech support/online presence
    - Monitor tlgrm, RC, (after trust established, twtr and reddit?)

### Helpdesk
Replaces tutorials

**Description:** *FILL IN*
- **CTA:** *FILL IN*
- **Author:** **Martin**
- **Distribution:** helpdesk repo
- **Assets:** Cover(s)

### Messages

**NOTE**
All public comms will follow the testnet design template currently WIP.

....

#### Announcing Acropolis Testnet

- **Description:** An initial message explaining what will be in Acropolis, why they should care,
showings its logo, and a scheduled date (we are not in full control), once features are locked in.
Telling people what the next sequence of events are, including future messages, future points in
time they must act.
- **CTA:** What action can people do, and how
- **Author:** **Martin**
- **Distribution:** TTRR
- **Assets:** Cover + some new pagebreakers

#### Acropolis Incentive Structure

- **Description:** Incentive structure and changes made for Acropolis + lessons learned
- **CTA:** Roles to take, and why
- **Author:** **Martin**
- **Distribution:** TTRR
- **Assets:** Cover + some new pagebreakers

#### Acropolis Released

- **Description:** TL;DR of previous posts with links + Full update on howto, with an emphasis on
new roles
- **CTA:** Sign up now
- **Author:** **Martin**
- **Distribution:** TTRR+newsletter
- **Assets:** Cover + some new pagebreakers

## Public Infrastructure

### Hosted Joystream Pioneer

- **Description:** Host a version of Joystream Pioneer on joystream.org + others?
- **Manager:** *FILL IN*
- **DevOps:** *FILL IN*
- **Repo:** Aim for static build of pioneer repo (similar to polkadot-js apps deployment)
- **Team:**
  - *FILL IN*
- **Tasks:**
  - *FILL IN*

### Hosted Joystream Storage Node

- **Description:** A storage node controlled by us, serving as fallback
- **Manager:** **Jens**
- **DevOps:** **Jens**
- **Repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Team:**
  - **Jens**
  - *FILL IN*

### Storage & distribution error endpoint

- **Description:** Reporting endpoint where any user of the data storage and distribution protocol can signal peer failures, will be deployed on error.joystream.org.
- **Manager:** *FILL IN*
- **DevsOps:** *FILL IN*
- **Repo:** TBD by *FILL IN*
- **Team:**
  - *FILL IN*
  - *FILL IN*
- **Note:**
  - Check out Logstash/Kibana/Mixpanel/Splunk

### Faucet service backend

- **Description:** Free token dispenser
- **Manager:** **Mokhtar**
- **DevOps:** **Mokhtar**
- **Repo (private):** [substrate-faucet](https://github.com/Joystream/substrate-faucet)
- **Team:**
  - **Mokhtar**
- **Tasks:**
  - Shouldn’t need much changes on backend, if using google captcha in pioneer.
  - Update README with instructions on how to deploy backend.

## Internal Infrastructure and Tools

### Payout Tool

- **Description:** Tool to compute payouts to relevant parties on testnet
- **Manager:** **Martin**
- **Repo (private):** [testnet-payout-scripts](https://github.com/Joystream/testnet-payout-scripts)
- **Team:**
  - **Martin**
- **Tasks:**
  - Update to cover storage providers

### Staging Testnet

- **Description:** Run a staging testnet with latest stable development runtime so that both ourselves and interested users can test new features, software, nodes without running closed `--dev` chains.
- **Manager:** **Mokhtar**
- **DevOps:** *FILL IN*
- **Repo:** N/A
- **Team:**
  - *FILL IN*
- **Tasks:**
  - *FILL IN*


## Internal Operations

### Payouts

- **Description:** Conduct regular payouts
- **Manager:** **Martin**
- **Team:**
  - **Martin**
- **Schedule:**
    - *FILL IN*


### Support

- **Description:** Provide support to users engaging with testnet functionality and campaigns
- **Manager:** - *FILL IN*
- **Team:**
  - **Martin**
  - *FILL IN*
- **Duration:**
  - Very high availability in the week following releases
  - No more than 24 hour lag in response to queries after that
- **Channels:**
  - Telegram
  - Reddit
  - RocketChat
