# Table of contents

- [Conducted Meetings](#conducted-meetings)
    - [Launch Meeting](#launch-meeting)
      - [Agenda](#agenda)
      - [Minutes](#minutes)
- [Planned Meetings](#planned-meetings)
    - [User Stories Meeting](#user-stories-meeting)
      - [Agenda](#agenda-1)
      - [Minutes](#minutes-1)
    - [Release Plan Finalization Meeting](#release-plan-finalisation-meeting)
      - [Agenda](#agenda-2)
      - [Minutes](#minutes-2)
    - [Other/Placeholder](#other)
    - [Lessons Learned](#lessons-learned)


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


### Objective: `Launch Rome network`
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


### Objective: `Launch Acropolis Network`
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

# Planned meetings

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
  -> Creating a tranche means comitting to be the liaison for it, as well as having capacity.
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
- **Starts:** `12:15 GMT+2`
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

:one: Finalize Release Plan

Temporary [link](https://github.com/bwhm/joystream/tree/acropolis/testnets/acropolis).

#### Minutes
**Started at:** `time`
**Present:**
* `person1`
* `...`

:one: Item 1.

:two: ....

**Other topics raised:**

**Ended at:** `time`

---

## Other

---

## Lessons Learned

**ID:** `Acropolis Lessons Learned`
- **Date:** `dd.mm.yy`
- **Starts:** `hh:mm CET`
- **Duration:** `mm`
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

:one: Item 1.

:two: ....

#### Minutes
**Started at:** `time`
**Present:**
* `person1`
* `...`

:one: Item 1.

:two: ....

**Other topics raised:**

**Ended at:** `time`
