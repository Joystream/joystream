<img src="img/rome-cover_new.svg"/>

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
- [OKR results](#okr-results)
- [Release Plan](#release-plan)
  - [Name](#name)
  - [Manager](#manager)
  - [Release Date](#release-date)
  - [Release OKRs](#release-okrs)
    - [Objective: `Introduce a Better Content System`](#objective-introduce-a-better-content-system)
    - [Objective: `Engage community to understand Rome and join us in the future`](#objective-engage-community-to-understand-rome-and-join-us-in-the-future)
  - [Tracking Issues](#tracking-issues)
  - [Milestones](#milestones)
  - [Deployment](#deployment)
<!-- TOC END -->

# Overview

During the planning stages of a new testnet, we produce a new release plan.

While working on [Acropolis](/testnets/acropolis), we decided to abandon the approach of creating a single `Release Project` kanban board on GitHub. These quickly became bloated and created more confusion than value. We instead created [Tracking Issues](#tracking-issues) for the two major component of the release - the [forum](https://github.com/Joystream/joystream/issues/47) and the [storage node](https://github.com/Joystream/joystream/issues/57). These made it far simpler to get a good grasp of completed and outstanding items at a high level.

After the [Acropolis Lessons Learned Meeting](/meetings/acropolis#lessons-learned), and thinking about our approach to project management and progress tracking, we have decided to expand on this concept. The release plan will no longer contain a "todo" list but instead link to "live" [Tracking Issues](#tracking-issues) covering all aspects and actions of the release. Each of these will be as contained as they can, to avoid the need for all team members to be present and listening to in-depth technical and organizational conversations outside of their scope.

#  Specification

TBD

# OKR results

This section will only include the final grading after network release. The release OKRs can be found [here](#release-okrs), and you can track our progress [here](/okrs#release-okrs).

# Release Plan

This Release Plan is considered "final" once merged to master, and anything below this will *not* be changed despite changing circumstances.

## Name

`Rome`

## Manager

`Martin`

## Release Date

04.11.19, 11:00 (GMT+2)

## Release OKRs

### Objective: `Introduce a Better Content System`
- **Active from:** 20.08.19
- **KR Measurement Deadline**: 7 days after Rome launch
- **Tracked**: Every Tuesday
- **Tracking Manager**: Martin
- **Key Results**:
  1. `Members can make a Content Creator profile and publish content under this profile.`

  2. `Introduce the role of staked Content Curators, policed by sudo.`

  3. `Launch with 3 content types.`

  4. `Add 1 new content type after release.`

  5. `Add a new schema for a content type, and migrate only some instances to the new schema.`

<br />


### Objective: `Engage the community to understand Rome and join us in the future`
- **Active from:** 20.08.19
- **KR Measurement Deadline**: 7 days after Rome launch
- **Tracked**: Every Tuesday
- **Tracking Manager**: Martin
- **Key Results**:

  1. `20 Content Creator profiles which add at least one content item.`

  2. `Get 5 active Content Curators.`

  3. `At least 20 items for each content type enabled at launch.`

  4. `At least 500 items in total across all content types.`

<br />

#### OKR Notes

##### Specific
* [Technical OKR](#objective-introduce-a-better-content-system)
  * `1.` A member can create multiple "Content Creator" profiles associated with their membership ID.
  * `3. - 5.` The content types and schemas must be understood by both the runtime and pioneer.

* [Community OKR](#objective-engage-community-to-understand-rome-and-join-us-in-the-future)
  * `2.` "Active" means Content Curators that are not fired as a result of not following their responsibilities.
  * `3. & 4.`: Content "items" means the number of entries in the content directory, not the data objects associated with the entry.

##### General
* For the previous testnet, we have tried making each KR be a mix of pure technical implementation, and community engagement in one single release OKR. This lead to:
  * confusion during tracking
  * unclear responsibilities and primary focus (ie. make it work, or make it user friendly)
  * ambiguity around time and deadlines
  * disappointment when the technical work has been completed, but "marketing" failed due to time or unrealistic numbers
  * subjective/changing final grading to counter above point
* For these reasons, we have decided on a new approach:
  * separate the technical and community in two Release OKRs
  * make all KRs as clear, unambiguous and objective as possible (for grading)
  * make the tracking less subjective (as we have numbers from Tracking Issues as guides, not just the assigned individuals guesstimate)

<br />

Go [here](/okrs#release-okrs) for tracking.

## Tracking Issues

The purpose and workflow of Tracking Issues can be found [here](/README.md#tracking-issues)

  - [1. New Infrastructure Runtime Modules](https://github.com/Joystream/joystream/issues/95)
  - [2. Media System (Static Parts)](https://github.com/Joystream/joystream/issues/96)
  - [3. Media System (Dynamic Parts)](https://github.com/Joystream/joystream/issues/97)
  - [4. Post-Release Media System Changes](https://github.com/Joystream/joystream/issues/98)
  - [5. Launch New Substrate Chain](https://github.com/Joystream/joystream/issues/99)
  - [6. Community Engagement Marketing](https://github.com/Joystream/joystream/issues/100)
  - [7. Operations and Standalone Tasks](https://github.com/Joystream/joystream/issues/101)
  - [8. Release/Launch Operations](https://github.com/Joystream/joystream/issues/102)

---

## Milestones

The purpose and workflow of Milestones can be found [here](/README.md#milestones)

|    Date   |   Event                           |     Involved                   |
|:---------:|-----------------------------------|:------------------------------:|
| 22.08.19  | Rome Announced                    |  Martin, Bedeho, Elpassion     |
| 26.08.19  | Working Specs                     |  Alex, Bedeho, Mokhtar         |
| 14.10.19  | Produce Sub-System Test Checklist | All                            |
| 18.10.19  | Perform Sub-system Test           | All + 2x testers               |
| 21.10.19  | Produce Final Test Checklist      | All                            |
| 25.10.19  | Perform Final Test                | Martin, Mokhtar + 3x testers   |
| 28.10.19  | Produce Release Checklist         | All                            |
| 28.10.19  | Snapshot and kill Acropolis       | All                            |
| 01.11.19  | Launch Ready                      | All                            |
| 04.11.19  | Release                           | All                            |

Go [here](https://github.com/Joystream/joystream/issues/103) for status and updated dates.

---

## Deployment

Start a fresh chain, with a new genesis block and joystream-node binary.

Built from a more recent version of the [substrate](https://github.com/paritytech/substrate) node template.

**Transferring of the following:**
- Memberships
- Forum Posts

All `keys` stored locally in the browser of each user will still work (though the balance will not be transferred).
In practice, this means all `keys` associated with a `member` will still have the following qualities:

- Posts on the `forum` can still be edited by the `member` that made the post.
- All `members` will be allocated a small balance in the genesis block to allow them to post on the `forum` and upload `content`.
