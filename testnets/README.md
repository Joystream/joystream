<p align="center"><img width=200px src="testnet-logo.png"></p>
<p align="center" style="font-size:100px;font-weight:100;">Testnet Releases</p>

# Table of contents

- [Live Testnet](#live-testnet)
- [Next Testnet](#next-testnet)
- [Past Testnets](#past-testnets)
- [Testnet Planning](#testnet-planning)
  - [Set-by-step Process](#step-by-step-process)
  - [Branding](#branding)
  - [Testnet Directory](#testnet-directory)
  - [Roles](#roles)
    - [Release Manager](#release-manager)
    - [Specification Lead and Committee](#specification-lead-and-committee)

# Live Testnet

Sparta <=== add image

# Next Testnet

[Athens](athens/README.md) <=== add image

# Past Testnets

| Network         | Started           | Ended         | Release Plan    |
| -------------   | -------------     | -----         | -----           |
| Sparta          | x                 |   NA          |       NA        |
| Mesopotamia     | x                 |   x           |       NA        |

# Testnet Planning

## Step-by-step Process

This whole process should take no more than **X** days from start to finish, and involves the following sequence of events and corresponding deadlines.

1. The following must be determined no later than **the day before the prior testnet release.**

    - [**RM**](#release-manager)
    - testnet name, denoted by `TESTNET_NAME`
    - tentative release date

2. **RM** shall have done the following no later than at **the day after the prior testnet release.**

    - created PR establishing a new [testnet directory](testnet-directory), where
        - the release name is set to `TESTNET_NAME`
        - the naming rationale is left blank, unless it is ready
        - the goal is left blank, unless it is ready
        - the logomark is left blank, unless it is ready

    - initiated creation of possibly missing logomark

    - scheduled a meeting time for the [launch meeting](launch-meeting) no later than the next available working day when all core contributors are available.

    - create a subdirectory of the [meeting](meetings) directory that has itinerary with appropriate agenda

3. Conduct launch meeting.

4. After the meeting is over, the **RM** shall on the same day have the testnet directory pull request merged with completed itinerary.

5. Leads must complete their user stories contributions, in the form of PRs into the meeting directory, before the user stories meeting starts.

6. Conduct user stories meeting.

7. After the meeting is over, the **RM** shall have the lead pull requests merged, with possible modifications, no later than **the day after**.

8. Leads must complete their release plan sections, in the form of PRs into the meeting directory, before the release plan finalisation meeting starts.

9. Conduct release plan finalisation meeting.

10. After the meeting is over, the **RM** shall on the same days

    - create a github project per release objective on the [Joystream Github Organisation](https://github.com/orgs/Joystream/projects) which kanban boards with standardized columns: `TODO`, `In progress`, `Done` and `Halted`.

    - update release document link to relevant github projects.

    - updates the label set to reflect any new possible products

10. Specification work begins, and is scheduled and organised on an ad-hoc basis. Anyone unaffected by this work can continue to move forward immediately.

11. Leads must convert their release plan contributions into tangible tasks, in the form of github issues on the relevant github project created. After this process, the release plan itself should no longer be consulted, also if changes are made.

12. Release planning meetings are conducted on a per-need basis, typically more frequently as the release date approaches.

## Branding

All releases have the following branding materials, which should be summarised in a markdown _Branding Document_

- **Name:** Our current naming system is important historical ancient cities in the development of new political systems. It's still not clear if we will just stick to ancient cities, or move forward in time also (TBD).
- **Naming Rationale:** A brief 40-150 word text about the significance of this city in our context.
- **Goal:** A brief 100-200 word text about what technical and community goals we are trying to achieve.
- **Logomark:** Illustrated logomark corresponding to name.

## Testnet Directory

All releases should have a corresponding _release directory_ in the `/testnets` directory of this repo, and it should have the following structure

- `RELEASE_NAME`
  - `README.md`: Release document.
  - **WIP**`specification.md`: Testnet speficiation.
  - `/branding`: A directory which includes a branding document and related assets, as described in the branding [section](branding)
  - `/tutorials`: User facing tutorials for participating on the network.

## Roles

### Release Manager

Each release is directed by a _Release Manager_ (**RM**) who is responsible for

 - Moving the release process forward and on track.
 - Calling and conducting release meetings.
 - Preparing all adminstrative pull requests for the release on this repo.

### Leads

A [release plan](release-plan-template.md) will consist of a set of projects, each with a corresponding lead, these are referred to as the _leads_.

### Specification Lead and Committee

The specification lead is responsible for moving the specification process forward, and the committee is anyone who is expected to contribute.

**WIP: we need to connect this to broader information about our specification work, but that is not done yet**

## Standard Release Meetings

### Launch Meeting

First release meeting, should take no more than **45 minutes**, with agenda

1. Propose set of release OKRs based on review of
    - open help desk issues that have bearing on release  
    - any possibly finalised OKRs from prior release
    - project OKRs
2. Identify set of projects, products etc. and assign leads.
3. Assign responsibility to someone for finalising outstanding branding assets, which must be delivered no later than **five days after this meeting**
4. Schedule the [user stories meeting](#user-stories-meeting) to no later than **two working days after this meeting**.

### User Stories Meeting

Second release meeting, should take no more than **90 minutes**, with agenda

1. For experiences identified in the [launch meeting](launch-meeting), review proposed user stories suggestions prepared by each lead, and settle on final set of stories
2. Schedule the [Release Plan Finalisation Meeting](#release-plan-finalisation-meeting) to no later than **two working days after this meeting**.

### Release Plan Finalisation Meeting

Third release meeting, should take no more than **90 minutes**, with agenda

1. Finalise release plan based on lead proposals
2. Evaluate whether plan is feasible based on projected total load on contributors, and tentative release date. If not feasible, try to make minor modifications of scope or deadline. If that also does not work, go back and redo process from launch meeting step.

If feasible, then proceed with

3. If a specification is to be done, assign a [specification lead and committee](Specification Lead and Committee), and schedule first [specification planning meeting](#specification-planning-meeting)

### Specification Planning meeting

Open ended technical meetings which are conducted iteratively with implementing out parts of the release.
