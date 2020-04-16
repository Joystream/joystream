# Table of contents

<!-- TOC START min:1 max:3 link:true asterisk:false update:true -->
- [Table of contents](#table-of-contents)
- [Conducted Meetings](#conducted-meetings)
  - [Launch Meeting](#launch-meeting)
  - [User Stories Meeting](#user-stories-meeting)
  - [Release Plan Finalization Meeting](#release-plan-finalization-meeting)
  - [Release Plan Milestone Evaluation Meeting](#release-plan-milestone-evaluation-meeting)
  - [Lessons Learned](#lessons-learned)
<!-- TOC END -->


# Conducted Meetings

## Launch Meeting

- **ID:** `Acropolis Launch Meeting`
- **Date:** `26.04.19`
- **Starts:** `12:15 CET`
- **Duration:** `45min`
- **Venue:** `ZOOM`
- **Lead**: `Bedeho`
- **Minutes**: `Martin`
- **Participants**:
  - `Alex`
  - `Bedeho`
  - `Jens`
  - `Martin`
  - `Mokhtar`

#### Agenda
:one: Present first release OKR proposal for discussion:


#### Objective: `Launch Rome network`
- **Active from:** 29.04.19
- **KR Measurement Deadline**: 7-9 days after Rome launch (first weekday)
- **Tracked**: Every Monday
- **Tracking Manager**: Martin
- **Key Results**:
1. `Get nnn posts on forum (limits, not Jsg) (ewd)`
    - Bedeho: 3/4
    - Alex: 1/4
2. `All nm modules fully specd (n)`
    - Bedeho: 1/2
    - Mokhtar: mm/(nm*2)
    - Alex: am/(nm*2)
    - Jens: jm/(nm*2)
3. `Add tranches to storage-node (ewd)`
    - Jens (2/3)
    - Mokhtar (1/3)
4. `No changes in code repos (excluding "pioneer") 5 days before release (ewd)`
    - Martin: 1/2
    - Jens: 1/6
    - Mokhtar: 1/6
    - Bedeho: 1/6
5. `One more feature, or measurement of interaction`

---

:two:. Identify projects, products, features, etc. and assign leads.

:three: Schedule "User Stories Meeting".


#### Minutes
**Started at:** 12.15CET
**Present:** Everyone

:one: OKR discussions


1. We all agreed KR1 was reasonable. Not much discussion.
2. The point of having specs was not contentious.
Discussions on how to best implement the specs:
* Which repo(s) to create/contain the specs.
* Tag them for each release separately, or release them in on bulk.
* Bedeho to determine, feel free to comment on this.
3. We agreed on the concept of adding tranches. We may want to clarify what this actually entails, but should not be specified in the KR itself.
4. We agreed on the concept of "feature freeze", but the KR was poorly phrased.
Jens made a good point, which I hope is clarified in the KR now. (comments?)
5. We stop at four instead of forcing another KR. KISS.

As a consequence of `5.`, this seems more like a subrelease from a user POW. This makes it a smaller release, thus no point in straying away from the greek theme. The discussion led to the following OKR for Acropolis:


#### Objective: `Launch Acropolis Network`
- **Active from:** 30.04.19
- **KR Measurement Deadline**: 7-9 days after Acropolis launch (first weekday)
- **Tracked**: Every Monday
- **Tracking Manager**: Martin
- **Key Results**:
1. `Get 200 posts on forum (limits, not Jsg) (ewd)`
    - Bedeho: 3/4
    - Alex: 1/4
2. `All n* modules fully specd (n)`
    - Bedeho: 1/2
    - Mokhtar: n_m/(n*2)
    - Alex: n_a/(n*2)
    - Jens: n_j/(n*2)
    - Bedeho: n_b/(n*2)    
3. `Add tranches to storage-node (ewd)`
    - Jens (2/3)
    - Mokhtar (1/3)
4. `No PRs merged to master (excluding bugfixes and "pioneer") after "Module Test" (ewd)`
    - Martin: 1/2
    - Jens: 1/8
    - Mokhtar: 1/8
    - Bedeho: 1/8
    - Alex: 1/8

`* Bedeho to define n, n_m, n_a, n_j, n_b`

---
:two: Projects, products and features
We did not explicitly address this point on the agenda, but it follows from the OKR that the main feature and leads are:

- Add an on-chain forum. Lead: Bedeho
- Make a detailed spec for all modules. Bedeho is the coordinator, but everyone will produce their own specs based on his template.
- Add tranches to the storage node. Lead: Jens.

:three: User stories meeting
The User Stories meeting is to be held on Tuesday at 12:15CET.

**Other topics raised:**
No

**Ended at:** 13:15CET

## User Stories Meeting

**ID:** `Acropolis User Stories Meeting`
- **Date:** `30.04.19` -> `02.05.19`
- **Starts:** `12:15 CET`
- **Duration:** `90min`
- **Venue:** `ZOOM`
- **Lead**: `Bedeho`
- **Minutes**: `Martin`
- **Participants**:
 - `Alex`
 - `Bedeho`
 - `Jens`
 - `Martin`
 - `Mokhtar`

#### Agenda
:one: After the [launch meeting](#launch-meeting), we agreed on the specific goals for `Acropolis`. Based on this, each lead shall prepare user stories for discussion, settle on final set of stories, and what consequences this may bring.


##### Forum
```
## Forum

This covers the experience of users across Pioneer, the command line.

### All (members + non-members)


As a user I can view a list of top level topic categories.
As a user I can open topic categories and view threads, by title and date of submission, and subtopic categories.
As a user I can view the set of moderators for a topic category.
As a user I can view a paginated list of posts in a thread.
As a user I can view the author, date of submission, text and history of edits for a post.

### Member

As a member I can post a new thread in a category, with a title and post.
As a member I can compose a post with text and images and submit to a thread.
As a member I can edit the text of a post a fixed number of times.
As a member I can learn how to become moderator in a given category.
As a member I can become a top level moderator by contacting Sudo (some how?).
As a member I can become a non-top level moderator by contacting the moderator of the parent category.

### Moderator

As a moderator I can pin and unpin a post at the top of a category.
As a moderator I can create a subcategory of my category.
As a moderator I can archive and unarchive a subcategory of my category.
As a moderator I can lock and unlock a thread in my category.
As a moderator I can make/remove someone a moderator in a subcategory of my category.
As a moderator I can delete a post in my category, leaving a reason.

### Sudo

As sudo I can alter the moderator set in any topic category
As sudo I can delete a category.
As sudo I can lock any member from doing any member+ level behaviour on the forum, and unlock.
As sudo I can change key forum constraint variables on mutating/creating posts, threads, etc.
```

##### Storage
```
## Storage
As root, I want to create storage tranches in order to manage the network.
As root, I want to activate/deactivate storage tranches.
  -> Without working groups, this has to be root.

As a storage provider, I want to sign up to a tranche in order to start serving data.
As a storage provider, I want to view the tranches I'm signed up to in order to manage my capacity.
As a storage provider, I want to remove myself from storage tranches in order to manage my capacity.
  -> Instead of staking for the storage provider role, one stakes for a tranche - otherwise the
     mechanism is largely identical.
  -> Must be possible for a single key to stake for multiple tranches.

As an uploader, I want the runtime to choose an appropriate storage tranche liaison for my upload.
As a downloader, I don't want to know anything about storage tranches.
  -> Essentially, either role shouldn't know about tranches - but uploaders have this refined
     requirement on the runtime API.


Notes: the current base of hyperdrive repositories effectively requires a fixed
  liaison per drive, with everyone else mirroring. There is therefore an
  alternative approach feasible.


As a storage provider, I want to create storage tranches in order to advertise my liaison capacity.
  -> Creating a tranche means comitting to be the liaison for it, as well as having capacity.
  -> Signing up for a tranche means having mirroring capacity and serving data.

As a non-liaison storage provider, I want to sign up to a tranche in order to mirror and serve data.
As a storage provider, I want to view the tranches I'm signed up to in order to manage my capacity.
As a storage provider, I want to remove myself from storage tranches in order to manage my capacity.
As an uploader, I want the runtime to choose an appropriate storage tranche liaison for my upload.
As a downloader, I don't want to know anything about storage tranches.
```

:two: Schedule the [Release Plan Finalisation Meeting](#release-plan-finalisation-meeting) to no later than **two working days after this meeting**.

#### Minutes
**Started at:** `12:20 CET`
**Present:**
- `Alex`
- `Bedeho`
- `Jens`
- `Martin`
- `Mokhtar`
- `Matthew` (observer)

:one: User Stories
#### Forum
Topics that generated the most discussion:
* User edits
  * Scope
  * Functionality
  * UI vs. "on-chain"
* The concept of `moderators`.
  * Should it be a role (already)
  * Hierarchy and rights for each `moderator`
  * Only `sudo` as `moderator`
  * `sudo` to assign and revoke moderations rights

Document after live edits:
```
## Forum
This covers the experience of users across Pioneer, the command line.

### All (members + non-members)
As a user I can view a list of top level topic categories.
As a user I can open topic categories and view threads, by title and date of submission, and subtopic categories.
As a user I can view the set of moderators for a topic category. <= OUT!
As a user I can view a paginated list of posts in a thread.
As a user I can view a post, in terms of author, date of submission and text
As a user I can view the history of edits on a post <= OUT!
### Member
As a member I can create a new thread in a category, with a title and text.
As a member I can compose a post in markdown and submit to a thread.
As a member I can reply to a prior post in a thread by getting a quote of the prior post in my composer.
As a member I can edit the text of a post.
As a member I can learn how to become moderator in a given category. <= OUT!
As a member I can become a top level moderator by contacting Sudo (some how?). <= OUT!
As a member I can become a non-top level moderator by contacting the moderator of the parent category. <= OUT!

### Moderator <== OUT
As a moderator I can pin and unpin a post at the top of a category.
As a moderator I can create a subcategory of my category.
As a moderator I can archive and unarchive a subcategory of my category.
As a moderator I can lock and unlock a thread in my category. <== OUT!
As a moderator I can make/remove someone a moderator in a subcategory of my category. <== OUT!
### Forum Sudo
As forum sudo create a subcategory.
As forum sudo I can delete a post.
As forum sudo I can delete a category.
### Sudo
As sudo I can make a member a forum sudo.
As sudo I can remove a forum sudo.

As sudo I can alter the moderator set in any topic category <== OUT!
As sudo I can change key forum constraint variables on mutating/creating posts, threads, etc. <== OUT!
```


#### Tranches
Topics that generated the most discussion:
* Information and requirements for SPs
* Uploaders/downloaders should not be affected by transfers
* dataObjectType tied to tranches? Runtime to assign based on dataObjectType
* How to separate and run multiple tranches on one host. Implications
  * Key management (single/multi/hierarchical)
  * By implication, `stake`
  * Repo management (one owner of each repo -> one owner of each tranch)
  * Multiple repos or multiple instances of software on same host

Document after live edits:
```
## Storage
### Sudo
As sudo, I want to create storage tranches in order to manage the network.
As sudo, I want to activate/deactivate storage tranches. < out
  -> Without working groups, this has to be sudo.
### Storage Provider
As a prospective storage provider, I want to know what the role entails.
As a storage provider, I want to sign up to a tranche in order to start serving data.
As a storage provider, I want to view the tranches I'm signed up to in order to manage my capacity.
As a storage provider, I want to remove myself from storage tranches in order to manage my capacity.
As a storage provider, I have to sign up for each tranche with a new key and run a separate storage instance for each tranche.
  -> Instead of staking for the storage provider role, one stakes for a tranche - otherwise the
     mechanism is largely identical.
### Uploader
As an uploader, I want the runtime to choose an appropriate storage tranche liaison for my upload.
### Downloader
As a downloader, I don't want to know anything about storage tranches.
  -> Essentially, either role shouldn't know about tranches - but uploaders have this refined
     requirement on the runtime API.
Note: the implication of these is that we have to define data object types for the release as well as their appropriate tranches.
Note: in this model we need to ensure that pioneer selects the correct data object type for the file to be uploaded, and the liaison enforces the appropriate constraints for this data object type. We probably need a mapping from data object type to constraints (1:1 or N:M) on the runtime.


Notes: the current base of hyperdrive repositories effectively requires a fixed
  liaison per drive, with everyone else mirroring. There is therefore an
  alternative approach feasible.


As a storage provider, I want to create storage tranches in order to advertise my liaison capacity.
  -> Creating a tranche means committing to be the liaison for it, as well as having capacity.
  -> Signing up for a tranche means having mirroring capacity and serving data.

As a non-liaison storage provider, I want to sign up to a tranche in order to mirror and serve data.
As a storage provider, I want to view the tranches I'm signed up to in order to manage my capacity.
As a storage provider, I want to remove myself from storage tranches in order to manage my capacity.
As an uploader, I want the runtime to choose an appropriate storage tranche liaison for my upload.
As a downloader, I don't want to know anything about storage tranches.
```


:two: Did not get to this.

**Other Topics raised:** No

**Ended at:** `14:05 GMT+2`

---

## Release Plan Finalization Meeting

**ID:** `Acropolis Release Plan Finalization Meeting`
- **Date:** `09.05.19`
- **Starts:** `11:15 GMT+2`
- **Duration:** `90min`
- **Venue:** `ZOOM`
- **Lead**: `Martin`
- **Minutes**: `Martin`
- **Participants**:
 - `Alex`
 - `Bedeho`
 - `Jens`
 - `Martin`
 - `Mokhtar`

#### Agenda

:one: Finalize Release Plan

#### Minutes
**Started at:** `11:15 GMT+2`
**Present:**
- `Alex`
- `Bedeho`
- `Jens`
- `Martin`
- `Mokhtar`
- `Dagur` (observer)

:one:
The items in the draft [Release Plan](../testnets/acropolis) was examined and discussed. The main points of discussions were:

 - Realistic numbers for the the [release OKR](../testnets/acropolis#release-okrs)

Settled on:
1. `Get 75 posts on forum (limits, not Jsg) (ewd)`
2. `Forum (runtime), storage (runtime and P2P) fully specd (n)`
3. `Have 4x replication for all 2 tranches on storage node (ewd)`
4. `95% uptime Storage Providers (ewd)`
5. `No PRs merged to master (excluding bugfixes and "pioneer") after "Sub-system Test" (ewd)`

- `Colossus` and `Pioneer` had not been filled in by their respective leads, and was only covered superficially.

- The [milestones](../testnets/acropolis#milestones) sections saw small adjustments to the Spec Release date, and a request to re-write the Sub-systems Test for clarity.

- For the [Public Infrastructure](../testnets/acropolis#public-infrastructure) section:
  - It was decided finally to remove the `Storage and Distribution Error Endpoint` tool to reduce the SoW for the [Colossus](../testnets/acropolis#colossus) team.
  - Hosted Joystream Storage Node(s) will be set up to "ensure" service, but the node(s) will not have any special status on the network.

- For the [Internal Infrastructure](../testnets/acropolis#internal-infrastructure-and-tools) section, it was decided after some back and forth that Alex will be the manager Storage Uptime and Quality Tool.

**Other topics raised:**

Before the meeting was adjourned, the issue of making the Forum work without an [Indexing Node](https://github.com/Joystream/indexing-node-joystream) was discussed.

**Ended at:** `12:30 GMT+2`

---

## Release Plan Milestone Evaluation Meeting

**ID:** `Acropolis Release Plan Milestone Evaluation Meeting`
- **Date:** `11.06.19`
- **Starts:** `11:15 GMT+2`
- **Duration:** `45 min`
- **Venue:** `ZOOM`
- **Lead**: `Martin`
- **Minutes**: `Martin`
- **Participants**:
 - `Alex`
 - `Bedeho`
 - `Martin`
 - `Mokhtar`

#### Agenda

:one: Evaluate the feasibility of [Scheduled Milestones](../testnets/acropolis#milestones) and update [Live Milestones](../testnets/acropolis#live-milestones).
:two: Evaluate feasibility of the scope.


#### Minutes
**Started at:** `11:15 GMT+2`
**Present:**
- `Alex`
- `Bedeho`
- `Martin`
- `Mokhtar`
- `Dagur` (observer)

:one:
#### Sub-System test Forum:
- Bedeho to complete runtime build, assisted by Mokhtar/Alex
  - To be completed by Thursday for Alex to be unblocked
- Alex to focus on functionality, and reduce scope related to UI (e.g. not add pagination)
  - Sub-System test scheduled for Monday 17.06.19

- After Sub-System test, minor changes will be made to the runtime to initialize the new state.

#### Sub-System test Storage:
- Mokhtar to continue test and development of IPFS backend
- Discovery test on `staging-reckless`
  - Demo later today

- Sub-System test scheduled for Friday the 14.06.19

#### Full integration

- Final test scheduled for Thursday 20.06.19

:two:
Based on the conclusion in :one:, it was decided to delay Storage Tranches for the next release.

**Ended at:** `12:30 GMT+2`

---

## Lessons Learned

**ID:** `Acropolis Lessons Learned`
- **Date:** `02.07.19`
- **Starts:** `11:15 GMT+2`
- **Duration:** `mm`
- **Venue:** `ZOOM`
- **Lead**: `Martin`
- **Minutes**: `Martin`
- **Participants**:
 - `Alex`
 - `Bedeho`
 - `Martin`
 - `Mokhtar`

#### Agenda

:one:
OKR grading.

:two:
What went wrong with planning and producing specs?

:three:
Although we ended up releasing almost on time, we were not really ready.
- We merged non-bug PRs after `Full test` (even worse than `Sub-system`)
- We found a lot of bugs after `Full test`, that should have been uncovered earlier.
- The release was poorly managed from a PR/marketing point of view.
- The weekend before the release put some extra strain on the team.

:four:
We initially set out to make `issues` in the applicable repos, and add them to the [Release Project](https://github.com/orgs/Joystream/projects/7). In practice, we tracked both [forum](https://github.com/Joystream/joystream/issues/47) and [storage](https://github.com/Joystream/joystream/issues/57) progress with a single issue in this repo. Should we continue this way?

:five:
1. Migration was an afterthought, we missed part of the state. Must be fully specced, and later finalized when we know more. Release plan template and progress tracking must include it.
2. Problems discovered that final test missed => we need final test protocol defined well before test, e.g. when scheduled
3. Reddit forgotten.
4. Coordination with Web3/Polkadot failed.
5. Infrastructure rollout of Pioneer and front page must be 100% finished _before_ we make upgrade an announce, there must be no time where page & pioneer are publicly broken or waiting to be upgraded.
6. Last minute chrome issue was not detected.
7. We need more time to do full cross platform Quality Assurance on node setup, multiple days perhaps.
8. We need to schedule enough time after all software is finished for fully writing up all guides.


#### Minutes
**Started at:** `11:15 GMT+2`
**Present:**
* `Alex`
* `Bedeho`
* `Mokhtar`
* `Martin`

:one:  
1. `Get 75 posts on forum (limits, not Jsg) (ewd)`
**Results:**
0.55
**Comment:**
Although we only got 7 posts that counts, the forum was shipped successfully. We decided to grade it as two separate results:
```
1.0 * 0.5 + 7/75 * 0.5 = 0.55
```

2. `Forum (runtime), storage (runtime and P2P) fully specd (n)`
**Results:**
0.67
**Comment:**
The forum and storage runtime was fully spec'd, whereas the P2P aspect of the storage was considered too incomplete to publish.

3. `Have 4x replication for all 2 tranches on storage node (ewd)`
**Results:**
0.5
**Comment:**
We achieved more than 4x replication, but tranches had to be abandoned.

4. `95% uptime Storage Providers (ewd)`
**Results:**
0.75
**Comment:**
We split this up in two parts, where the end user uptime, and provider uptime was weighted at 0.5 each:
```
1.0 * 0.5 + 0.5 * 0.5 = 0.75
```

5. `No PRs merged to master (excluding bugfixes and "pioneer") after "Sub-system Test" (conf)`
**Results:**
0.5
**Comment:**
The storage node had non-bug fixes (improvements) merged to master after "Full test", whereas the forum side had none.

##### Improve phrasing

In general, we learned that the KRs have to be written and clarified better to reflect the goals for the release. It should be trivial to grade the OKR, while it should also reflect the level of success. This was brought up on later points as well. KR specific comments below:

1. We need to make it clear whether the goal is shipping a feature or getting interest. In this case, the KR only reflected participation, which was not Alex and Bedehos job. In the future, we must go for one or the other.

2. This KR was clear and unambiguous.

3. This KR was clear and unambiguous.

4. The "tool" was delayed, and not properly followed up. As a consequence, it was hard to actually grade it. Like for `1.`, it must be clear what we are actually tracking.

5. We realized we need more time between testing and release. See items :three: and :four:.

Finally, we discussed some general thoughts on how to organize OKRs. This was a recurring in the meeting, and we learned that we need to reconsider our approach to writing and tracking them for releases.

:two:  
Runtime was "easier" to spec, whereas high level p2p is much harder to formalize.
Conclusion was to accept that specs need to be high level at this stage in development.

:three:  
Without addressing each point in this item specifically, we agreed that:
- Need more time between `Sub-system test` and actual release.
- Checklist (for launches)
- Checklist (for testing)
- More milestones (so we can follow the release plan deliverables)

:four:
Everyone agreed to continue "large" issues, covering all aspects of each goal.
If possible, we should try to combine KRs with these larger issues in a way where we can grade and track based on checkmarks filled either directly or with weighting.

:five:
1. Put more though and planning in to migration.
2. See item :three: (more extensive unit tests)
3. Wrongish (posted on r/dot and r/joystream, but no follow up).
4. See planning of releases in general.
5. Again, somewhat poor planning due to time-constraints. Should prepare a deployment plan for updates in `Pioneer`. Potentially have `Pioneer` (and other apps) check the runtime version before serving the user, or make a simpler way of deploying where the user get a notification that an upgrade is happening.
6. See `5.`
7. Not really an issue.
8. See various points on needing more time before release.

**Other topics raised:**

- We need more eyes on each repo.

This leads to problems close to releases, when there is no one that can review properly. In particular for the storage node, where we had to rely on testing, not actually reviewing the codebase.

- Size of PRs.

Smaller, contained and more frequent PRs, when possible.

- Forum, unlike storage, had better follow-up and timeline more in line with the milestones.

However, there should have been better unit test coverage, and explanations of what the test did/should do. In the future, we should add empty tests as "todo" in the code.

**Ended at:** `12:35GMT+2`
