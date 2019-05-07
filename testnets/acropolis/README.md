
<img src="acropolis-cover.svg"/>

<div align="center">
  <h3>
    <a href="#">
      Specification
    </a>
  </h3>
</div>

# Table of contents
<!-- TOC START min:1 max:3 link:true asterisk:false update:true -->
- [Table of contents](#table-of-contents)
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
- [Release OKRs](#release-okrs)
    - [Objective: `Launch Acropolis Network`](#objective-launch-acropolis-network)
  - [Constraints](#constraints)
  - [Risks](#risks)
  - [Deployment](#deployment)
  - [Products](#products)
    - [Runtime](#runtime)
    - [Colossus](#colossus)
    - [Pioneer](#pioneer)
  - [Milestones](#milestones)
    - [Spec Release](#spec-release)
    - [Sub-system Test](#sub-system-test)
    - [Final Test](#final-test)
    - [Runtime Proposal](#runtime-proposal)
    - [Release](#release)
  - [Go-To-Market](#go-to-market)
    - [Participation Incentives](#participation-incentives)
    - [Helpdesk](#helpdesk)
    - [Messages](#messages)
  - [Public Infrastructure](#public-infrastructure)
    - [Hosted Joystream Pioneer](#hosted-joystream-pioneer)
    - [Hosted Joystream Storage Node](#hosted-joystream-storage-node)
    - [Storage & distribution error endpoint](#storage--distribution-error-endpoint)
    - [Faucet service backend](#faucet-service-backend)
  - [Internal Infrastructure and Tools](#internal-infrastructure-and-tools)
    - [Payout Tool](#payout-tool)
    - [Staging Testnets](#staging-testnets)
    - [Storage uptime and quality tool](#storage-uptime-and-quality-tool)
  - [Internal Operations](#internal-operations)
    - [Payouts](#payouts)
    - [Support](#support)
<!-- TOC END -->


# Live Milestones

WIP


#### Actual dates:

- **TBD**



# Past Release Meetings

| Name/category            | Date            | Itinerary and Minutes                                  |
| :----------------------: | :-------------: |:------------------------------------------------------:|
| Launch Meeting           | 26.04.19        | [link](../meetings/acropolis/#launch-meeting)          |
| Acropolis User Stories   | 02.05.19        | [link](../meetings/acropolis#user-stories-meeting)     |

#  Specification

After [discussing](../reports/archive/2.md) internally, the specs for Acropolis will be made using [this](https://github.com/bedeho/joystream/blob/rome-spec/testnets/rome/members-module.md) as a reference (link to be replaced after merge).

# GitHub Projects

The current set of relevant GitHub projects are

- [Acropolis Release](https://github.com/orgs/Joystream/projects/7)

# OKR results

NA.

# Release Plan

**This plan was made in advance, and anything below this line will not be updated inspite of changing circumstances.**

## Name

`Acropolis`

## Manager

`Martin`

## Release Date

20 June 2019, 12:00 (GMT+2)

## OKRs
WIP

# Release OKRs
### Objective: `Launch Acropolis Network`
- **Active from:** 09.05.19
- **KR Measurement Deadline**: 7-9 days after Acropolis launch (first weekday)
- **Tracked**: Every Monday
- **Tracking Manager**: Martin
- **Key Results**:
1. `Get 100 posts on forum (limits, not Jsg) (ewd)`
2. `Forum (runtime), storage (runtime and P2P) fully specd (n)`
3. `Have 4x coverage for all 3 tranches on storage node (ewd)`
4. `95% uptime Storage Providers (ewd)`
5. `No PRs merged to master (excluding bugfixes and "pioneer") after "Sub-system Test" (ewd)`


Go [here](../okrs/#release-okrs) for more details and tracking.

## Constraints

- Major changes required for the [Storage Node/Colossus](#colossus) and storage system as a whole.

## Risks

- [Specification](#specification-plans) of new sub-systems may be more time consuming and iterative than anticipated.
- The full implication of re-writing [Storage Node/Colossus](#colossus) are unknown at the time of writing.
- Risks are partially mitigated by extending the cycle for Acropolis. Somewhat ironically, this introduces some risk that the release might collide with peak holiday season.

## Deployment

On-chain upgrade of runtime. Scope and extent of migrations unknown.

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
  - **Bedeho:** Developer
  - **Martin:** Testing
- **Main repo:** [substrate-runtime-joystream](https://github.com/Joystream/substrate-runtime-joystream)
- **Current version:** *FILL IN*
- **New version:** *FILL IN*
- **Audit:** No
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

### Colossus
---
*(keep name?)*

- **Description:** Combined storage and distribution node.
- **Manager:** Jens
- **Team:**
  - **Jens:** Developer
  - **Mokhtar:** Developer  
  - *FILL IN*
  - **Martin:** Testing
- **Main repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Current version:** *FILL IN*
- **New version:** *FILL IN*
- **Audit:** No
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
  - Will replace old storage system with the runtime upgrade.

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
 - **Audit:** No
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
|    15.05.19     | [Spec Release](#spec-release)         | Alex, Bedeho, Jens, Mokhtar             |
|    12.06.19     | [Sub-system Test](#sub-system-test)   | All                                     |
|    17.06.19     | [Final Test](#final-test)             | Martin, Mokhtar + 2x community members  |
|    18.06.19     | [Runtime Proposal](#runtime-proposal) | Mokhtar, Martin                         |
|    20.06.19     | [Release](#release)                   | All                                     |


### Spec Release

- **Description:** Release the specs for Acropolis
- **Deadline:** 15. May
- **Manager:** **Bedeho**
- **Team:**
  - **Mokhtar:**
  - **Alex:**
  - **Jens:**
  - **Bedeho:**
- **Time line:**
  - First draft of specs must be ready for review on the 15th of May at the latest.
  - Bedeho will review and approve, or delegate the task.

### Sub-system Test

- **Description:** Test all sub-systems/software separately on a/the staging testnet
- **Deadline:** 12. June
- **Manager:** **Martin**
- **Team:**
  - **Mokhtar:** Test guide for all sub-systems/software under his responsibility
  - **Alex:** Test guide for all sub-systems/software under his responsibility
  - **Jens:** Test guide for all sub-systems/software under his responsibility
  - **Bedeho:** Test guide for all sub-systems/software under his responsibility
- **Test specification:**
  - All developers must demonstrate full functionality of their sub-systems/software. Runtime should be completed.
      1. with a working branch of Pioneer (compatible with Athens, _must_ not include rest of Acropolis scope)
      2. any other supporting software (compatible with Athens, _must_ not include rest of Acropolis scope)
      3. if applicable, present clear list of items outstanding with:
          - dependencies / responsible person(s)
          - realistic timeline
          - what, if any, should be postponed/abandoned for late release or next release.
          - note that both RM and developer are responsible for this list not coming as a surprise.

**Note** After this test, only bugfix PRs can be merged to master branch of relevant repos.

### Final Test

- **Description:** Upgrade a staging testnet runtime to "Acropolis", and perform a full feature test.
- **Deadline:** 17. June
- **Manager:** **Mokhtar**
- **Team:**
  - **Martin:** Lead tester
  - **Community Member 1:** Tester
  - **Community Member 2:** Tester
- **Time line:**
  - A full test of all features and cycles on the platform with Acropolis runtime. Participants must use different OS' and browsers, for joystream-node, storage-nodes and pioneer.

### Runtime Proposal

- **Description:** Make `proposal` for a new runtime with the `sudo.key`.
- **Deadline:** 18. June 11:00GMT+2
- **Manager:** **Mokhtar**
- **Team:**
  - **Martin:** Reach out to council members, promote voting, and prepare final blog/newsletter for Acropolis.
- **Time line:** After the runtime upgrade proposal is submitted, the actual upgrade will happen 48h later.

### Release
- **Description:** If proposal does not reach quorum and the proposal has not received legitimate criticism, immediately force the new proposal with the `sudo key`. To avoid having the runtime upgrade happen before that time, Martin and Mokhtar will hold their vote until 10 blocks before the voting period expires.
- **Deadline:** 20. June 12:00GMT+2
- **Manager:** **Mokhtar**

---

## Go-To-Market

**Note**
Reference to a date or a [milestone](#milestones) should be made for each of these items.

### Participation Incentives

- **Description:** For Acropolis, the intention is to continue with three paid roles:
  * Validators
  * Council Members
  * Storage Providers
  * Note that "Bug Reporters/Builders" will also be incentivized, although not a formal role ATM.
- **Deadline:** 18. June
- **Manager:** **Martin**
- **Team:**
  - **Martin:** Manager
  - **Bedeho:** ElPassion Manager
  - **Mokhtar:** Developer
  - **Tomasz:** Designer
  - *FILL IN* Community manager
- **Tasks:**
  - **Bedeho**, **Tomasz:**
    - Update Joystream.org with new testnet summary information
    - *FILL IN*
  - **Mokhtar:**
    - *FILL IN*
  - **Martin:**
    - Write & publish blog post(s) and newsletter
    - Update/maintain [Helpdesk](#helpdesk)
    - *FILL IN*
  - **FILL IN:**
    - Tech support/online presence
    - Monitor tlgrm, RC, and on-chain forums.

### Helpdesk

**Description:** Updated guides must be ready for launch.
- **Deadline:** 19. June
- **Author:** **Martin**
- **Distribution:** helpdesk [repo](https://github.com/Joystream/helpdesk)
- **Assets:** Cover(s)

### Messages

**NOTE**
All public comms will follow the testnet design template, ref. [this](https://github.com/Joystream/communications/issues/18).


#### Announcing Acropolis Testnet

- **Description:** An initial message explaining what will be in Acropolis, why they should care,
showings its logo, and a scheduled date (we are not in full control), once features are locked in.
Telling people what the next sequence of events are, including future messages, future points in
time they must act.
- **Deadline:** 13. June
- **CTA:** What action can people do, and how
- **Author:** **Martin**
- **Distribution:** TTRR
- **Assets:** Cover + some new pagebreakers

#### Acropolis Incentive Structure

- **Description:** Incentive structure and changes made for Acropolis + lessons learned
- **Deadline:** 18. June
- **CTA:** Roles to take, and why
- **Author:** **Martin**
- **Distribution:** TTRR
- **Assets:** Cover + some new pagebreakers

#### Acropolis Released

- **Description:** TL;DR of previous posts with links + Full update on howto
- **Deadline:** 20. June
- **CTA:** Join
- **Author:** **Martin**
- **Distribution:** TTRR+newsletter
- **Assets:** Cover + some new pagebreakers

## Public Infrastructure

### Hosted Joystream Pioneer

- **Description:** Host a version of Joystream Pioneer on joystream.org + others? (*FILL IN*)
- **Manager:** *FILL IN*
- **DevOps:** *FILL IN*
- **Repo:** Aim for static build of pioneer repo (similar to polkadot-js apps deployment)
- **Team:**
  - *FILL IN*
- **Tasks:**
  - *FILL IN*

### Hosted Joystream Storage Node

- **Description:** *FILL IN* (liason? regular? fallback only? )
- **Manager:** **Jens**
- **DevOps:** **Jens**
- **Repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Team:**
  - **Jens**
  - *FILL IN*
- **Tasks:**
  - *FILL IN*

### Storage & distribution error endpoint

- **Description:** Reporting endpoint where any user of the data storage and distribution protocol can signal peer failures, will be deployed on error.joystream.org. *FILL IN*
- **Manager:** *FILL IN* (Jens?)
- **DevsOps:** *FILL IN*
- **Repo:** TBD by *FILL IN*
- **Team:**
  - *FILL IN*
  - *FILL IN*
- **Tasks:**
  - *FILL IN*
- **Note:**
  - Check out Logstash/Kibana/Mixpanel/Splunk *FILL IN*

### Faucet service backend

- **Description:** Free token dispenser
- **Manager:** **Mokhtar**
- **DevOps:** **Mokhtar**
- **Repo (private):** [substrate-faucet](https://github.com/Joystream/substrate-faucet)
- **Team:**
  - **Mokhtar**
  - **Martin**  
- **Tasks:**
  - Update README with instructions on how to deploy backend *FILL IN*
  - Keep it stocked with tokens
  - Delete old data at least weekly

## Internal Infrastructure and Tools

### Payout Tool

- **Description:** Tool to compute payouts to relevant parties on testnet
- **Manager:** **Martin**
- **Repo (private):** [testnet-payout-scripts](https://github.com/Joystream/testnet-payout-scripts)
- **Team:**
  - **Martin**
- **Tasks:**
  - Must be updated to cover new storage node.

### Staging Testnets

- **Description:** Run a staging testnet with latest stable development runtime so that both ourselves and interested users can test new features, software, nodes without running closed `--dev` chains.
- **Manager:** **Martin**
- **DevOps:** **Martin**
- **Repo:** N/A
- **Team:**
  - Martin
- **Tasks:**
  - Keep at least two staging testnets running.
  - One continuous that will mirror existing testnet
  - One "on demand" for reckless testing

### Storage uptime and quality tool

- **Description:** Tool to verify uptime and quality of service by registered `Storage Providers`
- **Manager:** **Mokhtar** *FILL IN ?*
- **Repo (private):** *FILL IN*
- **Team:**
  - **Mokhtar**
  - **Martin**
- **Tasks:**
    - Build the tool
    - Maintain
    - Devops

## Internal Operations

### Payouts

- **Description:** Conduct regular payouts
- **Manager:** **Martin**
- **Team:**
  - **Martin**
- **Schedule:**
    - Mondays at 10:00 GMT+2

### Support

- **Description:** Provide support to users engaging with testnet functionality and campaigns
- **Manager:** - **Martin**
- **Team:**
  - **Martin**
  - *FILL IN*
- **Duration:**
  - Very high availability in the week following releases
  - No more than 24 hour lag in response to queries after that
- **Channels:**
  - Telegram
  - GitHub
  - RocketChat
  - On-chain forums
