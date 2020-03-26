<img src="img/constantinople-cover.svg"/>

<div align="center">
  <h3>
    <a href="specification/README.md">
      Specification
    </a>
  </h3>
</div>

Table of Contents
=================
<!-- TOC START min:1 max:3 link:true asterisk:false update:true -->
- [Overview](#overview)
- [Specification](#specification)
- [Goals](#goals)
- [Resources](#resources)
- [Release Plan](#release-plan)
  - [Name](#name)
  - [Team & Responsibilities](#team--responsibilities)
  - [Project Management](#project-management)
  - [Manager](#manager)
    - [Github Projects](#github-projects)
  - [Release Date](#release-date)
    - [Approach](#approach)
- [Tasks](#tasks)
  - [Runtime Development](#runtime-development)
  - [Pioneer](#pioneer)
  - [Operations](#operations)
    - [Fiat backed token model](#fiat-backed-token-model)
    - [Gated faucets](#gated-faucets)
    - [KPIs](#kpis)
    - [Release](#release)
    - [Communication](#communication)
  - [Total](#total)
  - [Milestones](#milestones)
<!-- TOC END -->

# Overview

During the planning stages of a new testnet, we produce a new release plan.

As with previous releases, the managing and tracking progress towards the end of [Rome](/testnets/rome) became an issue. This lead to the conclusion of targeting smaller, incrimental releases, and the return of the github kanban boards.

# Specification

TBD

# Goals
1. Launch new proposal system.
2. Launch new fiat backed token model.
3. Launch in less than 6? weeks from start.
4. Low overhead progress & prioritisation management using Github projects.

# Resources
- Early proposal system spec: https://github.com/Joystream/joystream/issues/161
- Token Model: https://github.com/Joystream/joystream/issues/171
- Preliminary Pioneer user stories: https://github.com/Joystream/joystream/issues/180

# Release Plan

This Release Plan is considered "final" once merged to master, and anything below this will *not* be changed despite changing circumstances.

## Name

`Rome`

## Team & Responsibilities

- Shamil: runtime

- Alex: front-end + tooling

- Mokhtar: runtime + tooling

- Ben: communication + testing + support

- Martin: release management + tokenomics + KPIs + tooling + testing

- Bedeho: tokenomics + review

## Project Management

The main goal of the management style outlined here is to allow us to better detect whether we in total are on track to hit our required milestones, and if not, where we need to change priorities with regards to features or manpower. All with minimal person to person coordination effort.

## Manager

`Martin`

### Github Projects

- [Runtime](https://github.com/orgs/Joystream/projects/10)
- [Pioneer](https://github.com/orgs/Joystream/projects/12)
- [Operations](https://github.com/orgs/Joystream/projects/13)

## Release Date

`11.05.20`

### Approach

The basic approach will be to have a set of Kanban board style Github project, where all work lives as an issue. After a process where each high level, initial task below is inspected by the assigned person, that task is broken down to one or more issues, and each issue is given a time estimate. After this, the assigned person, the `release manager`, and any other people involved, ensures that we are left with a complete set of issues that combined covers what is needed to reach the goals above. This should ensure that all tasks are addressed from all angles, namely the `runtime`, `pioneer` and `operations`.

Each issue must be narrow and precise enough that:

- There is exactly one assigned person.

- It is expected to take no more than **12 hours** of focused work to complete.

If the assigned person finds him or herself spending more than this amount of time an issue, then decompose the issue into a set of smaller more precise issues, possibly partially assigned to other people, and close the initial issue with a comment about what was done.


#### In-flight

- When writing in daily standup, each entry that has to do with Constantinople _must_ link to an issue.

- Before starting work on an issue, move it into `In Progress`.

- Any PR opened must reference the relevant issue(s) being addressed.

- When PR is completed, close both underlying issue and PR.

#### Detecting overruns (release manager)

Every week, the `release manager` will do as follows for each project above.

- Compute the total number of hours completed.

- Compute the total number of hours remaining.

- Roughly divide the hours remaining among the assigned individuals.

- Compare the largest workload to the remaining time to the most immediate milestone affecting this project.

- If we are overrunning badly (>30%), alert relevant parties, and reevaluate priorities. If we are only mildly reevaluating (<10%), then make a note of this for next week, and if this is the second week in a row there is a mild overrun, then again alert relevant parties for reevaluation.

# Tasks

## Runtime Development
**Issues created: 37**
**Estimated hours: 300**

- Complete proposal engine (shamil)

- Proposal discussion system (shamil)

- Update storage module to make these adjustable by SUDO: count & staking limit & reward (shamil)

- Update content working group to make these adjustable by SUDO: update reward & staking limit & hiring constraint fields (shamil)

- Add explicit reward for council members: https://github.com/Joystream/substrate-runtime-joystream/issues/148 8 (shamil)

- Implement proposal logic for changing runtime parameters (shamil)

  - Validator count.

  - Validator base reward.

  - Storage provider count.

  - Storage provider reward.

  - Storage provider staking limit.

  - Content Curator reward.

  - Content Curator staking limit.

- Implement proposal logic for updating runtime: only a hard coded member can submit! (shamil)

- Implement proposal logic for evicting a storage provider (shamil)

- Implement proposal logic for spending proposal, also fix this: https://github.com/Joystream/substrate-runtime-joystream/issues/158 (shamil)

- Define proposal type parameters. (martin)

- Migration logic from Rome: We need to reset all, or some balances, however, this will disrupt all the stakes of people involved in various roles (council, validation, storage, curators, etc.) and also stakes of voters currently staking. A strategy is needed. One approach is to kick everyone out of all roles, except a single validator and storage provider that we run? More thinking is needed. (mokhtar)

## Pioneer
**Issues created: 25**
**Estimated hours: 86**

- User stories (bedeho)

- Task flows (alex)

- Wireframes (alex)

- Implement components in Storybook (alex)

- Introduce in UI in Pioneer (alex)

- Integrate with runtime (alex)

## Operations
**Issues created: 32**
**Estimated hours: 282**

### Fiat backed token model

**Estimated hours: 63**

- An integrated model, e.g. in Excel, for how to set nominal (tJOY) runtime variables, given policy  and runtime variables. Is meant to be used by Jsgenesis to actually set initial policy and runtime variables, but also by council to set runtime variables over time. Not sure if tool should include dynamics, or just static t=0 state. Should also give insight into how attractive different positions will be under a given scenario, in order to aid calibration in-flight. (martin, ben)

- Actual initial policy variable values. (martin, ben)

- Actual runtime variable values. (martin, ben)

- A public tokenomics page that covers (ben)

  - Current exchange rate / price.

  - All current policy variable values, and a history of past values.

  - Record of all adjustments to reward pool, with date and rationale, and links to full reviews of KPI performance payouts.


### Gated faucets

**Estimated hours: 39**

- Bounties:

  - How to make list?

  - How to price?

  - How to give users awareness of current bounties?

- Mailing List: How much?

- Existing Memberships: How much?

- Spend to charity:

  - What charities to accept?

  - How is spending proven?

  - How to avoid abuse?

  - What is reward policy?

- Any other sort of faucet? (martin, ben)

### KPIs

**Estimated hours: 114**

#### Funding proposal KPI

- KPI parameter values. (martin, ben)

- A format in which funding proposals must be written in for council to accept and Jsgenesis to finance. (martin, ben)

- A format for summarising evaluation of performance of KPIs. (martin, ben)

- A policy guideline on what must absolutely NOT be funded. (martin, ben)

#### Content publication KPI

- KPI parameter values. (martin, ben)

- Define acceptable licenses. (martin, ben)

- Provide example links. (martin, ben)

#### Content curation KPI


- KPI parameter values. (martin, ben)

#### Storage benchmark KPI


- KPI parameter values. (martin, ben)

- Storage benchmarking tool finalisation. (alex)

- Run tests in test environment (ben, martin)

- Create benchmarking KPI and run tests in test environment (ben, martin)

#### Block production KPI

- KPI parameter values. (martin, ben)

- Validator load/DoS script finalisation. (mokhtar)

- Run tests in test environment. (ben, martin)

- Create validator benchmark. (martin, ben)

### Release

**Estimated hours: 27**

- Make test protocol, including actual upgrade step. (martin)

- Conduct test protocol. (martin, ben)

### Communication

**Estimated hours: 39**

- Communication strategy: We need to draw the attention of a lot of different actors, both to the initial announcement and launch, but also to important events like new KPIs or other critical policy changes. How and when is this done? (ben, martin)

- New branding creation (ben)

- New network website: what metrics should be tracked? perhaps more targeting the new stuff? (ben)

- Announcements on blog & newsletter(s)

 - Network announcement: explains new incentive model etc.

 - Network release


## Total

Per 26.03.20, this comes to a total of:
**Issues created: 37+25+32=94**
**Estimated hours: 300+86+282=668**

## Milestones

| Date   |   Event                |  Status                      |
|:------:|:----------------------:|:----------------------------:|
|02.04.20|Constantinople Announced| :negative_squared_cross_mark:|
|29.04.20|Complete Sub-system Test| :negative_squared_cross_mark:|
|05.05.20|Complete Final Test     | :negative_squared_cross_mark:|
|08.05.20|Launch Ready            | :negative_squared_cross_mark:|
|11.05.20|Release                 | :negative_squared_cross_mark:|
