<img src="img/athens-cover_new.svg"/>

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
  - [Events](#events)
    - [Athens Runtime Testnet](#athens-runtime-testnet)
    - [Runtime Upgrade](#runtime-upgrade)
  - [Go-To-Market](#go-to-market)
    - [Paid Roles](#paid-roles)
    - [Tutorials](#tutorials)
    - [Messages](#messages)
      - [Runtime upgrades vs forks](#runtime-upgrades-vs-forks)
      - [Announcing Athens Testnet](#announcing-athens-testnet)
      - [Athens Incentive Structure](#athens-incentive-structure)
      - [Athens Released](#athens-released)
  - [Public Infrastructure](#public-infrastructure)
  - [Internal Infrastructure and Tools](#internal-infrastructure-and-tools)
  - [Internal Operations](#internal-operations)
  - [Milestones](#milestones)

# Live Milestones

- **Newsletter, final social media** `24. April 2019`
#### Actual dates:
- **Update website:** `18. April 2019`
- **Release, publish blog, twitter:** `17. April 2019 *`
- **Soft Release, update Pioneer (telegram):** `15. April 2019`
- **Final Test run:** `14. April 2019`
- **Intermediate Test run:** `09. April 2019, 12:00 (GMT+1)`

`*`Denotes syncing between storage providers is outstanding.

# Past Release Meetings

| Date            | Link          |
| -------------   | ------------- |
| NA              | x             |

#  Specification

TBD.

# GitHub Projects

The current set of relevant GitHub projects are

- [Athens Release](https://github.com/orgs/Joystream/projects/5)

# OKR results

NA.

# Release Plan

**This plan was made once, but is not kept in synch with ongoing efforts and adjustments.**

## Manager

`Martin`

## Release Date

4 April 2019, 12:00 (GMT+1)

## OKRs

### Objective: `Launch Athens network`
- **KR Measurement Deadline**: 1 week after Athens launch
- **Key Results**:
##### 1. `Get 10 claims per $ for tokens on our faucet`
##### 2. `Have all episodes of the Staked (4) and Make_World (n) podcast in the content directory`
##### 3. `Have second council upgrade consensus after reaching quorum`
##### 4. `20 Uploads (100min) and 100 Downloads not including Jsgenesis`
##### 5. `75 Memberships created (not including Jsgenesis) at a min 1/2 membership/unique view ratio`

- **Final Score**

| Date     | KR #1 | KR #2 | KR #3 | KR #4 | KR #5 |  Total  |
|:--------:|:-----:|:-----:|:-----:|:-----:|:-----:|:-------:|
| 23.04.19 | 0.05  | 0.83  |  0.5  |  0.67 | 0.66  |**0.642**|

Full details of tracking of results can be found in the [archive](../okrs/OKR-archive/athens).

## Constraints

- We will delay doing any serious investment in documentation, audits or specifications in this release, in order to prioritize learning how to do timely and well planned releases, before investing in these longer term assets.

- We will continue to not do any serious work in the UX, in particular in the Pioneer application, in order to move faster using the Polkadot UI framework. We can afford small tweaks here and there based on user input, but a fundamental reworking is delayed until at least after Athens.

## Risks

- **Jens** may not be able to reliably participate, and its not clear when new TT dev will be found and onboarded.

- **Bedeho** will try to contribute on Runtime work, but he also has to get familiar with Rust & Substrate, as well as other unreliable priorities.

## Specification Plans

No.

## Deployment

On-chain upgrade of runtime, no migration.

## Products

The following public products will be part of this release.

### Runtime
---
- **Description:** Runtime for Validator node
- **Manager:** Mokhtar
- **Core Team:**
  - **Mokhtar:** Developer
  - **Alex:** Developer
  - **Jens:** Developer
  - **Martin:** Testing
  - **Bedeho:** Developer
  - **Jaydip:** Devops
- **Main repo:** [substrate-runtime-joystream](https://github.com/Joystream/substrate-runtime-joystream)
- **Current version:** 4
- **New version:** 5
- **Audit:** NO
- **Documentation:** NO CHANGE
- **Legal Review/ToS update:** NO CHANGE
- **Build/CI system:**
  - **Jaydip:** Get CI builds for runtime
- **Target Platforms:** NO CHANGE
- **New/Altered Functionality:**
  - **Mokhtar:** Basic membership system:
    - Pay for membership signup
    - No working groups for screening or policing
    - Reusing storage for avatar persistence.
    - Lets delay BRAQ fee model, since its not an absolute requirement
    - Do Validators also have to be members. (will require changing staking
module)
    - Replace/Update Indices module (account indexing)
  - **Jens**, **Mokhtar:** Basic storage and distribution:
    - Roles combined into single staked actor that fully replicates full data
directory
    - No working group, anyone can enter so long as they pass requirements.
    - We can kick out an actor through root by fiat
    - Basic data directory
      - no tranches -(all storage nodes do full replication?)
      - only the object types required in this release
      - very few data object types (which?)
  - **Jens:** Basic content directory
    - controlled by through root, no working group
    - policed through sudo
    - basic publisher profile.
    - Supports two content types
      - a standalone video clip (podcasts are published)
      - an audio podcast series and episodes
    - All static assets live in storage system
  - **Mokhtar:** do something about spam risk, e.g. falt tx fee
- **Refactor/Reorganization:**
  - Split the runtime into its own repo, and include a docker script for doing
reproducible builds. Will be needed for testing/verifying runtime upgrade
proposals, and first use will be for this next release
- **New Key User Stories:** NONE
- **Deployment/Distribution:**
    - Will be voted in through an upgrade proposal in council, see Events section for how.

### Joyful
---

- **Description:** Validator node.
- **Manager:** **Mokhtar**
- **Team:**
  - **Mokhtar:** Developer
  - **Martin:** Testing
  - **Jaydip:** Devops
- **Main repo:** [substrate-node-joystream](https://github.com/Joystream/substrate-node-joystream)
- **Current version:** v0.10.
- **New version:** v0.10.2 (backward compatible with old nodes/chain (network/p2p/codec
etc..))
- **Audit:** NO
- **Documentation:** NO CHANGE
- **Legal Review/ToS update:** Yes (**Martin**)
- **Build/CI system:** NO CHANGE
- **Target Platforms:**
  - Mac
  - Win
  - Ubuntu
  - Docker image? / raspberry Pi, ARMv7 build
- **New/Altered Functionality:**
  - Prompt to accept TOS before running
  - Include latest runtime (native)
  - Built-in (subkey) for working with keys to not have to rely on web app?
  - Pull bug fixes that don’t break consensus from upstream?
- **New Key User Stories:** NONE
- **Deployment/Distribution:**
  - Will be have to be downloaded from GitHub release page, with links being
distributed relevant tutorials and communications.
  - **Jaydip:**
    - Get docker image based builds working
    - Docker image hosted on docker.com public repo + instructions?
    - OSX brew/Ubuntu snap?

### Colossus
---
- **Description:** Combined storage and distribution node.
- **Manager:** **>Jens**
- **Team:**
  - **Jens:** Developer
  - **Martin:** Testing
- **Main repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Current version:** 0.1.
- **New version:** 0.2.
- **Audit:** NO
- **Documentation:** API YES (needed for other devs to understand how to interface with
it).
- **Legal Review/ToS update:** Yes (**Martin**)
- **Build/CI system:** NO CHANGE
- **Target Platforms:** Linux. Testing required for others.
- **New/Altered Functionality:** **Jens**
  - This first version is based on the following:
  - for now, hyperdrive for storage & synchronizing (tech underlying Dat)
  - nodejs + expressjs + express-openapi for application facing API.
  - Exposes all operator and usage functionality through REST API, a standalone new js library should probably also be written for usage by client apps.
 - Synchronizes multiple storage nodes
 - Interfaces with blockchain as authority on members, content providers, etc.
 - API provides basic content discovery as well as upload/download.
- **New Key User Stories:**
  - As a new user, I can install via npm by doing npm install joystream-storage-node
  - As a new user, I can join the storage node pool.
- **Deployment/Distribution:**
  - Will be have to be downloaded from GitHub release page, with links being
distributed relevant tutorials and communications.

### Pioneer
---
 - **Description:** The user interface for interacting with the platform.
 - **Manager:** **Alex**
 - **Team:**
  - **Alex:** Developer
  - **Mokhtar:** Developer
  - **Tomasz:** Designer
  - **Martin:** Testing
 - **Main repo:** [apps](https://github.com/Joystream/apps)
 - **Current version:** 0.23.29 (inherited from Polkadot Apps)
 - **New version:** 0.2.
 - **Audit:** NO
 - **Documentation:** NO CHANGE
 - **Legal Review/ToS update:** Yes (**Martin**)
 - **Build/CI system:** NO CHANGE
 - **Target Platforms:** Web
 - **New/Altered Functionality**: **Alex**
  - Update name of application:
    - GitHub repo name
    - Browser title bar
    - HTML meta tags: description, and tags (facebook), twitter tags – this is
useful when sharing a link to the site on social sites (twitter, facebook) or
in chats like Telegram or Rocket.
  - Edit Profile page: avatar, handle, (full name?), links to other social accounts
(twitter, facebook, linkedin, telegram, etc.), bio/about.
  - Form validation: validate input values against constraints loaded from a
runtime such as:
    - is field required: yes/no?
    - a max length of text based fields.
  - View Profile page:
    - Display the same list of fields as we have on Edit Profile page
    - Public key of linked account.
    - Show free token balance + staked validator’s balance.
    - Registered on (date & time)
    - Is council member: Yes/No.
    - Memo.
  - List of members:
    - Show preview of each member: avatar, (nick)name, account id.
    - Search by handle or account id.
    - Pagination.
  - Storage providers
    - See list of storage providers
    - Join as a storage provider by stake a certain amount of tokens.
  - Publishing
    - Turn on publishing, with basic information
    - Upload and publish content
    - Input title, description, category (+ tags?)
    - Edit title, description, category after content uploaded?
  - Content consumption
    - See front page view of content directory
    - Play back video
    - Search by key words in title and description.
    - Browse videos and podcasts by categories
    - Filter by videos (yes/no) and podcasts (yes/no)
    - Pagination
  - Report video/podcast for being problematic in some way:
    - Button “Report” under video/podcast player.
    - An input field where a reporter can provide a reason why they are
reporting this particular content.
    - A separate page with reported content (or a separate site reports.joystream.org). Should this page be visible only to Jsgenesis
team or it can be open for anyone.
  - Event log as a list of all txs and actions user performed on the platform. Get
Substrate events where a current user was an origin of tx.
 - **New User Stories:**
  - As a new user I can install via?
 - **Deployment/Distribution:**
  - Will be have to be downloaded from GitHub release page.

## Events

### Athens Runtime Testnet

- **Description:** We conduct an actual testnet with ourselves and key community members as
participants.
- **Deadline:** 29. March
- **Manager:** **Martin**
- **Team:**
  - **Mokhtar:** Developer
  - **Jaydip:** DevOps
- **Test specification:**
  - _Please rewrite more clearly_

### Runtime Upgrade

- **Description:** Submit proposal to change to new image, and have council pass that proposal.
- **Deadline:** 02. April
- **Manager:** **Martin**
- **Team:**
  - **Martin:** Writing
  - **Mokhtar:** Developer
  - **Tomasz:** Designer
- **Time line:**
  - _Please rewrite more clearly_

## Go-To-Market

### Paid Roles

- **Description:** During the lifetime of the testnet, until next upgrade or network or discretionary
announcement, the following incentive campaign is in place to achieve key results for service
providers. Policy would be
  - Validator: 30$ per week -> 0.03C per block
  - Council Member: **8$** for seat, **5$** for vote on runtime upgrade(s)
  - Storage: **$10** per week, with **$0.025/GB** per week
- **Manager:** **Martin**
- **Team:**
  - **Martin:** Manager
  - **Bedeho:** ElPassion Manager
  - **Mokhtar:** Developer
  - **Tomasz:** Designer
  - **Jaydip:** Community manager/Devops
- **Tasks:**
  - **Bedeho**, **Tomasz:** Update Joystream.org with new testnet summary information
   - New fields about new state
     - Number of members (perhaps even actual names?)
     - Number of storage providers
     - Total amount of storage used
     - Total amount of content items published
   - Better representation about election cycle system, more clearly need to represent the multistaged nature, with a countdown to act, and perhaps why, and also a CTA to actually act.
   - New list of roles, with active ones emphasised
   - New section for next testnet, with state there <== needs name
  - **Mokhtar:** Update backend infrastructure to support new life Athens web based summary
  - **Martin:** Update or write tutorials for how to participate in roles on Github
    - Validator (systemd setup, fine tuning linux, inspiration: https://kb.certus.one/)
    - Storage Provider
  - **Martin:** Write & publish blog posts
    - [Runtime upgrades vs forks](runtime-upgrades-vs-forks)
    - [Announcing Athens Testnet](announcing-athens-testnet)
    - [Athens Incentive Structure](athens-incentive-structure)
    - [Athens Released](athens-released)
  - **Jaydip:** Tech support/online presence
    - Monitor tlgrm, RC, (after trust established, twtr and reddit?)

### Tutorials

#### How to be a Validator

- **Description:** Step by step guide for how to setup and run a validator node, and claim reward
- **CTA:** Go and setup your node
- **Author:** **Martin**
- **Distribution:** Github?
- **Assets:** NONE

#### How to be a Storage Provider

- **Description:** Step by step guide for how to setup and run a storage provider node, and claim reward
- **CTA:** Go and setup your node
- **Author:** **Jens**,**Martin**
- **Distribution:** Github?
- **Assets:** NONE

### Messages

#### Runtime upgrades vs forks

- **Description:** Somewhat technical blog about what these are, what they enable, and how we
are doing them.
- **CTA:** Educational+hiring credibility
- **Author:** **Mokhtar**,**Martin**
- **Distribution:** Twtr, Tlgrm, Reddit, RC + polkadot forum(s)
- **Assets:** Cover + some new pagebreakers - <Spartan w/sword defeating enemy w/fork>

#### Announcing Athens Testnet

- **Description:** An initial message explaining what will be in Athens, why they should care,
showings its logo, and a scheduled date (we are not in full control), once features are locked in.
Telling people what the next sequence of events are, including future messages, future points in
time they must act.
- **CTA:** What action can people do, and how
- **Author:** **Martin**
- **Distribution:** TTRR
- **Assets:** Cover + some new pagebreakers - <athenian owlcould be featured unless we want
to use this as “main” athens logo. >

#### Athens Incentive Structure

- **Description:** Incentive structure and changes made for Athens + lessons learned
- **CTA:** Roles to take, and why
- **Author:** **Martin**
- **Distribution:** TTRR
- **Assets:** Cover + some new pagebreakers - <something similar to the Spartan one, but with
new logo and storage provider role>

#### Athens Released

- **Description:** TL;DR of previous posts with links + Full update on howto, with an emphasis on
new roles
- **CTA:** Sign up now
- **Author:** **Martin**
- **Distribution:** TTRR+newsletter
- **Assets:** Cover + some new pagebreakers - < Athens logo>

## Public Infrastructure

### Hosted Joystream Pioneer

- **Description:** Host a version of Joystream Pioneer on joystream.org + others?
- **Manager:** **Jaydip**
- **DevOps:** **Jaydip**
- **Repo:** Aim for static build of pioneer repo (similar to polkadot-js apps deploymnet)
- **Team:**
  - **Jaydip**
- **Tasks:**
  - Reuse existing linode server or deploy to heroku for example (autodeploy o master branch merge)?

### Hosted Joystream Storage Node

- **Description:** A storage node controlled by us, serving as fallback
- **Manager:** **Jens**
- **DevOps:** **Jens**
- **Repo:** [storage-node-joystream](https://github.com/Joystream/storage-node-joystream)
- **Team:**
  - **Jens**

### Storage & distribution error endpoint

- **Description:** Reporting endpoint where any user of the data storage and distribution protocol can signal peer failures, will be deployed on error.joystream.org.
- **Manager:** **Alex**
- **DevsOps:** **Mokhtar**
- **Repo:** TBD by **Alex**
- **Team:**
  - **Alex**.
  - **Mokhtar**.
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
  - Host on different domain (currently on sparta.joystream.org)

## Internal Infrastructure and Tools

### Payout Tool

- **Description:** Tool to compute payouts to relevant parties on testnet
- **Manager:** **Martin**
- **Repo (private):** [testnet-payout-scripts](https://github.com/Joystream/testnet-payout-scripts)
- **Team:**
  - **Martin**
- **Tasks:**
  - Update to cover storage providers

## Internal Operations

### Payouts

- **Description:** Conduct regular payouts
- **Manager:** **Martin**
- **Team:**
  - **Martin**
- **Schedule:**
  - Storage and Validator get payouts mondays at ~1100GMT
  - Council gets payouts ~10:00GMT day after election and, if applicable, vote.

### Support

- **Description:** Provide support to users engaging with testnet functionality and campaigns
- **Manager:** **Jaydip**
- **Team:**
  - **Jaydip**
  - **Martin**
- **Duration:**
  - Very high availability in the week following releases
  - No more than 24 hour lag in response to queries after that
- **Channels:**
  - Telegram
  - Reddit
  - RocketChat

## Milestones

1. 29 March: Athens Runtime Testnet
2. 02 April: Runtime Upgrade
3. Update website?
4. Send out newsletter + blog
