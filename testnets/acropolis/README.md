
<img src="img/acropolis-cover_new.svg"/>

<div align="center">
  <h3>
    <a href="specification/README.md">
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
  - [Objective: `Launch Acropolis Network`](#objective-launch-acropolis-network)
- [Release Plan](#release-plan)
  - [Name](#name)
  - [Manager](#manager)
  - [Release Date](#release-date)
  - [OKRs](#okrs)
- [Release OKRs](#release-okrs)
    - [Objective: `Launch Acropolis Network`](#objective-launch-acropolis-network-1)
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

Due to changing circumstances, a meeting [Evaluating the feasibility](../meetings/acropolis##release-plan-milestone-evaluation-meeting) of the planned [Milestones](#milestones), the following conclusion was made:

| Date            |   Event                               |     Involved                            |
| :--------------:|:-------------------------------------:|:---------------------------------------:|
|    19.06.19     | [Spec Release](#spec-release)         | Alex, Bedeho, Mokhtar                   |
|    17.06.19     | [Sub-system Test](#sub-system-test)   | All                                     |
|    20.06.19     | [Final Test](#final-test)             | Martin, Mokhtar + 2x community members  |
|    22.06.19     | [Runtime Proposal](#runtime-proposal) | Mokhtar, Martin                         |
|    24.06.19     | [Release](#release)                   | All                                     |


#### Actual dates:

- `Spec Release` was partially completed on the 22.06.19 [link](https://github.com/Joystream/joystream/tree/master/testnets/acropolis/specification).
- `Sub-system Test` performed on or before 17.06.19.
- `Final Test` successfully completed on the 20.06.19
- `Runtime Proposal` made on the 22.06.19 [link](https://testnet-rpc.joystream.org/acropolis/pioneer/#/proposals/2)
- `Release` the network successfully upgraded on the 24.06.19

A summary of the tests for `forum` and `storage` can be read [here](https://github.com/Joystream/joystream/issues/47) and [here](https://github.com/Joystream/joystream/issues/57).


# Past Release Meetings

| Name/category               | Date            | Itinerary and Minutes                                     |
| :-------------------------: | :-------------: |:---------------------------------------------------------:|
| Launch Meeting              | 26.04.19        | [link](../../meetings/acropolis/#launch-meeting)             |
| User Stories                | 02.05.19        | [link](../../meetings/acropolis#user-stories-meeting)        |
| Release Plan Finalization   | 09.05.19        | [link](../../meetings/acropolis#release-plan-finalization-meeting)   |
| Release Plan Milestone Evaluation Meeting | 10.06.19         | [link](../../meetings/acropolis##release-plan-milestone-evaluation-meeting) | Re-evaluation of Milestones due to changing circumstances |
| Lessons Learned             | 02.07.19        | [link](../../meetings/acropolis/#lessons-learned)             |

#  Specification

After [discussing](../../reports/archive/2.md) internally, the specs for Acropolis will be made using [this](https://github.com/Joystream/joystream/blob/master/reports/archive/2-attachments/members-module.md) as a reference (link to be replaced after merge).

# GitHub Projects

The current set of relevant GitHub projects are

- [Acropolis Release](https://github.com/orgs/Joystream/projects/7)

# OKR results

## Objective: `Launch Acropolis Network`
- **Active from:** 09.05.19
- **KR Measurement Deadline**: 7-9 days after Acropolis launch (first weekday)
- **Key Results**:
##### 1. `Get 75 posts on forum (limits, not Jsg) (ewd)`
##### 2. `Forum (runtime), storage (runtime and P2P) fully specd (n)`
##### 3. `Have 4x replication for all 2 tranches on storage node (ewd)`
##### 4. `95% uptime Storage Providers (ewd)`
##### 5. `No PRs merged to master (excluding bugfixes and "pioneer") after "Sub-system Test" (conf)`

<br />

- **Final Score**

| Date     | KR #1 | KR #2 | KR #3 | KR #4 | KR #5 |  Total  |
|:--------:|:-----:|:-----:|:-----:|:-----:|:-----:|:-------:|
| 03.07.19 | 0.55  | 0.67  |  0.5  |  0.75 | 0.5   |**0.594**|

<br />

Full details of tracking of results can be found in the [archive](../okrs/OKR-archive/acropolis).

# Release Plan

**This plan was made in advance, and anything below this line will not be updated inspite of changing circumstances.**

## Name

`Acropolis`

## Manager

`Martin`

## Release Date

20 June 2019, 12:00 (GMT+2)

## OKRs

# Release OKRs
### Objective: `Launch Acropolis Network`
- **Active from:** 09.05.19
- **KR Measurement Deadline**: 7-9 days after Acropolis launch (first weekday)
- **Tracked**: Every Monday
- **Tracking Manager**: Martin
- **Key Results**:
1. `Get 75 posts on forum (limits, not Jsg) (ewd)`
2. `Forum (runtime), storage (runtime and P2P) fully specd (n)`
3. `Have 4x replication for all 2 tranches on storage node (ewd)`
4. `95% uptime Storage Providers (ewd)`
5. `No PRs merged to master (excluding bugfixes and "pioneer") after "Sub-system Test" (conf)`


Go [here](../../okrs/#release-okrs) for more details and tracking.

## Constraints

- Major changes required for the [Storage Node/Colossus](#colossus) and storage system as a whole.

## Risks

- [Specification](#specification-plans) of new sub-systems may be more time consuming and iterative than anticipated.
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
- **Current version:** v5.3.0
- **New version:** target v5.4.0 (unless there are bugfix runtime upgrades before release)
- **Audit:** No
- **Documentation:** Publish the rust docs for the runtime at testnet.joystream.org/runtime-docs/
- **Legal Review/ToS update:** No
- **Build/CI system:**
  - **Mokhtar:**
    * CI: Simple travis job for PRs, running cargo tests, and verifying build doesn't fail and rustfmt is used to format code
    * Build: Will have a working Docker file for building proposed WASM runtime blob
- **New/Altered Functionality:**
    * New Forum module (Bedeho)
    * Updated Actors module to support storage tranches (Jens/Mokhtar)
    * Updated storage modules to support storage tranches (Jens/Mokhtar)
    * Cleanup old migration code in members module (Mokhtar)
- **Refactor/Reorganization:**
  - Best effort should be made to make new runtime modules as separate git repos
  - Existing modules can remain in same repo
  - Docker
- **Deployment/Distribution:**
    - Will be voted in through an upgrade proposal in council, see Events section for how.

### Colossus
---

- **Description:** Combined storage and distribution node.
- **Manager:** Jens
- **Team:**
  - **Jens:** Developer
  - **Mokhtar:** Developer
  - **Martin:** Testing
- **Main repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Current version:** 0.1.0 (did not bump last release)
- **New version:** 0.2.0
- **Audit:** No
- **Documentation:**
  - [README](https://github.com/Joystream/storage-node-joystream/blob/master/README.md)
  - [Released API specs](https://storage-node-1.joystream.org/swagger.json)
- **Legal Review/ToS update:** No
- **Build/CI system:**
  - **Jens**
    * CI: Simple travis job, running unit tests.
    * Build docker image
- **Target Platforms:** Linux
- **New/Altered Functionality:**
  - Support storage tranches. The main difference is to stake for joining a tranche rather than the storage provider role.
    - Allow multiple keys, or allow one key to stake for multiple tranches.
  - Drop hyperdrive backend. Replace with IPFS backend.
    - Drop multiple repository concept, and repository IDs in URLs.
    - Replace sync protocol stack with simpler synchronization, downloading or pinning content from staked tranches.
  - Drop bittorrent-dht and use IPFS DHT and IPNS for liason/download endpoint announcement.
- **New Key User Stories:**
  - As a storage provider, in order to selectively provide storage, I want to stake for storage tranches.
  - As a storage provider, in order to fulfil my role, I want my storage node to synchronize content.
- **Deployment/Distribution:**
  - Dockerfile for deployment
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
 - **Current version:** N/A (`0.32.0-beta.6` shown in Pioneer)
 - **New version:** `3.0`
   - `0.x` - goes to Polka Apps.
   - `1.x` - Elections + Proposals modules.
   - `2.x` - Media module (explore + upload).
 - **Audit:** No
 - **Documentation:** No
 - **Legal Review/ToS update:** No. License to be added to migrated Repo.
 - **Build/CI system:** No
 - **Target Platforms:** Cross-platform and cross-browser.
 - **New/Altered Functionality**:
    - Integration with new storage system
    - Integration of forum
 - **New User Stories:**
    - See [here](../meetings/acropolis#)
 - **Deployment/Distribution:**
    - Upgrade of [hosted](#hosted-joystream-pioneer) Pioneer must be timed with release for integration with new storage system and forum.
    - Frequent non-breaking improvements/updates performed expected.


## Milestones

| Date            |   Event                               |     Involved                            |
| :--------------:|:-------------------------------------:|:---------------------------------------:|
|    21.05.19     | [Spec Release](#spec-release)         | Alex, Bedeho, Jens, Mokhtar             |
|    12.06.19     | [Sub-system Test](#sub-system-test)   | All                                     |
|    17.06.19     | [Final Test](#final-test)             | Martin, Mokhtar + 2x community members  |
|    18.06.19     | [Runtime Proposal](#runtime-proposal) | Mokhtar, Martin                         |
|    20.06.19     | [Release](#release)                   | All                                     |


### Spec Release

- **Description:** Release the specs for Acropolis
- **Deadline:** 21. May
- **Manager:** **Bedeho**
- **Team:**
  - **Mokhtar:**
  - **Jens:**
  - **Bedeho:**
- **Time line:**
  - First draft of specs must be ready for review on the 15th of May at the latest.
  - Bedeho will review and approve, or delegate the task.
  - Bedeho: Forum module & main spec document & review contributions

### Sub-system Test

- **Description:** Test all sub-systems/software separately on the [`staging-reckless`](#staging-testnets) testnet
- **Deadline:** 12. June
- **Manager:** **Martin**
- **Forum Team:**
  - **Alex:**
  - **Bedeho:**
- **Storage Team:**
  - **Mokhtar:**
  - **Alex:**
  - **Jens:**
- **Test specification:**
  - The members of each **Team** must be able present full functionality of their sub-systems/software, in the following environment:
      1. Perform runtime upgrade from current to test version
          * It's a preference, but not a requirement, for the same runtime to be used for both tests.
      2. with a working branch of Pioneer (compatible with Athens, _must_ not include rest of Acropolis scope)
      3. any other supporting software (compatible with Athens, _must_ not include rest of Acropolis scope)
      4. if applicable, present clear list of items outstanding with:
          - dependencies / responsible person(s)
          - realistic timeline
          - what, if any, should be postponed/abandoned for late release or next release.
          - note that both RM and developer are responsible for this list not coming as a surprise.

**Note** After this test, only bugfix PRs can be merged to master branch of relevant repos.

### Final Test

- **Description:** Upgrade the [`staging-lts`](#staging-testnets) testnet runtime to "Acropolis", and perform a full feature test.
- **Deadline:** 17. June
- **Manager:** **Mokhtar**
- **Team:**
  - **Martin:** Lead tester
  - **Community Member 1:** Tester
  - **Community Member 2:** Tester
- **Time line:**
  - A full test of all features and cycles on the platform with Acropolis runtime. Participants must use different OS' and browsers, for joystream-node, storage-nodes and pioneer.

### Runtime Proposal

- **Description:** Create a council runtime upgrade proposal for a new runtime with a member key.
provide a script/instructions for how to build the identical runtime proposed.
- **Deadline:** 18. June 11:00GMT+2
- **Manager:** **Mokhtar**
- **Team:**
  - **Martin:** Reach out to council members, promote voting, and prepare final blog/newsletter for Acropolis.
- **Time line:** Time line: After the runtime upgrade proposal is submitted, the actual upgrade will happen after all council members have voted. *48h in practice*

### Release
- **Description:** If proposal does not reach quorum and the proposal has not received legitimate criticism, immediately force the new proposal with the `sudo key`.
- **Deadline:** 20. June 11:00GMT+2
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
- **Tasks:**
  - **Bedeho**, **Tomasz:**
    - Update Joystream.org with new testnet summary information
  - **Martin:**
    - Write & publish blog post(s) and newsletter
    - Update/maintain [Helpdesk](#helpdesk)
    - Maintain [payout scripts](#payout-tool) and perform [payouts](#payouts)
  - **Community Member(s):**
    - Tech support/online presence
    - Monitor tlgrm, RC, and on-chain forums.

### Helpdesk

- **Description:** Updated guides must be ready for launch.
- **Deadline:** 19. June
- **Manager:** **Martin**
- **Team:**
  - **Martin**
  - **Community Member 1:** Tester
  - **Community Member 2:** Tester
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

- **Description:** Host a version of Joystream Pioneer on testnet.joystream.org
- **Manager:** Mokhtar
- **DevOps:** Mokhtar
- **Repo:** [apps](https://github.com/Joystream/apps) joystream branch (static build with yarn build)
- **Team:**
  - **Mokhtar**
- **Tasks:**
  - Update Caddy file to redirect https://testnet.joystream.org/athens/pioneer/ to https://testnet.joystream.org/acropolis/pioneer/

### Hosted Joystream Storage Node

- **Description:** One or more storage node(s) without any special status
- **Manager:** **Jens**
- **DevOps:** **Jens** **Mokhtar**
- **Repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Team:**
  - **Jens**
  - **Mokhtar**
- **Tasks:**
  - Host a node and signup to role in the tranches

### Faucet service backend

- **Description:** Free token dispenser
- **Manager:** **Mokhtar**
- **DevOps:** **Mokhtar**
- **Repo (private):** [substrate-faucet](https://github.com/Joystream/substrate-faucet)
- **Team:**
  - **Mokhtar**
  - **Martin**  
- **Tasks:**
  - Update README with instructions on how to deploy backend
  - Keep it stocked with tokens
  - Delete old data at least weekly
  - Modify frontend

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
  - One continuous that will mirror existing testnet - `staging-lts`
  - One "on demand" for reckless testing - `staging-reckless`

### Storage uptime and quality tool

- **Description:** Tool to verify uptime and quality of service by registered `Storage Providers`
- **Manager:** **Alex**
- **Repo (private):** [storage-quality-of-service](https://github.com/Joystream/storage-quality-of-service)
- **Team:**
  - **Alex**
  - **Jens**
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
  - **Community Member 1:**
  - **Community Member 2:**
- **Duration:**
  - Very high availability in the week following releases
  - No more than 24 hour lag in response to queries after that
- **Channels:**
  - Telegram
  - GitHub
  - RocketChat
  - On-chain forums
