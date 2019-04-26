<img src="meetings-cover.svg"/>

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
- **Active from:** 29.04.19
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

**Other Topics raised:**
No

**Ended at:** 13:15CET

# Planned meetings

## User Stories Meeting

**ID:** `Acropolis User Stories Meeting`
- **Date:** `30.04.19`
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
:one: For experiences identified in the [launch meeting](#launch-meeting), review proposed user stories suggestions prepared by each lead, and settle on final set of stories.
:two: Schedule the [Release Plan Finalisation Meeting](#release-plan-finalisation-meeting) to no later than **two working days after this meeting**.

#### Minutes
**Started at:** `time`
**Present:** `person1, ...`

:one: Item 1.
:two: ....

**Other Topics raised:**

**Ended at:** `time`

---

## Release Plan Finalisation Meeting

**ID:** `Acropolis Release Plan Finalisation Meeting`
- **Date:** `dd.mm.yy`
- **Starts:** `hh:mm CET`
- **Duration:** `mm`
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

:one: Item 1.
:two: ....

#### Minutes
**Started at:** `time`
**Present:** `person1, ...`

:one: Item 1.
:two: ....

**Other Topics raised:**

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
**Present:** `person1, ...`

:one: Item 1.
:two: ....

**Other Topics raised:**

**Ended at:** `time`
