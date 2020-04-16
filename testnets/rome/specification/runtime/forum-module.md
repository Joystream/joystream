# Forum Module

## Table Of Contents

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [create_category](#create_category)
  - [update_category](#update_category)
  - [create_thread](#create_thread)
  - [moderate_thread](#moderate_thread)
  - [add_post](#add_post)
  - [edit_post_text](#edit_post_text)
  - [moderate_post](#moderate_post)
  - [set_forum_sudo](#set_forum_sudo)
- [Non-dispatchable Methods](#non-dispatchable-methods)

## Design

### Motivation

This module holds the basic content and structure of a hierarchical topic based forum with trivial sudo moderation. It allows a blockchain to have _direct_ assertible custody of the forum governance and function. Systems which depend critical on reliable and fair asynchronous public discourse will benefit from this functionality.

### Structure

The structure of the forum is a collection of category trees. A category tree has of two types of nodes, a category or a thread. A category node represents a topic category, with a name and associated intended scope of discussion topics. A thread node represents an actual thread of one or more posts.

### Posts and threads

A thread is a sequence of posts, in a given category, which has some initial post from the original author, and title. A post exists in the context of a thread, and has some position in thread post sequence, as well as a body text. Both have a corresponding author and creation date. The text in a post can be edited by any time by the original author, however the history of all texts are available in the state.

### Users

Forum users can create threads in categories, and post to existing threads. This module does not maintain its own set of forum users, but rather depends on some external module for this. The rationale for this is to allow reuse of the module with a diversity of user management systems, without requiring that runtime developer must keep user set synchronised, or waste state space.

### Forum sudo

There will be a single account, called the _forum sudo_ account. This account is set by the Sudo of the runtime, and can

- **Create a category**: Can either be a new root category, or if parent category is referenced, it would be a subcategory.

- **Archive|Delete (Unarchive|Undelete) a category**: Results in category being marked as archived or deleted, while it and all corresponding threads, posts and subcategories remain in the state. It is however no longer possible to delete or mutate anything in the category in any way, such as adding posts, creating threads or subcategories, etc. Well-behaved UIs will not render deleted categories. In what follows a category is said to be _directly_ archived or deleted, if its applying directly to that category, and _indirectly_ if it applies to some ancestor category. The only distinction between archiving and deletion in the runtime is that a directly deleted category cannot be unarchived.

- **Moderate a post in a thread**: Results in post being marked as moderated, with a corresponding rationale for the moderation added, but it remains in the system state. It is not longer possible to edit the post text, and well-behaved UIs will not render such posts.

- **Moderate a thread**: Results in thread being marked as moderated, with a corresponding rationale for the moderation added, but it remains in the system state. It is not longer possible to moderate posts, edit post texts or add posts to the thread. Well-behaved UIs will not render such threads.

### Limits

There is a maximum depth to a category tree. This is because doing any mutation will require traversing the category tree to the root to check for whether there has been any deletion or archiving along the path to the root, and there needs to be a bound on this, herein called `MAX_CATEGORY_DEPTH`.

## Name

`Forum`

## Dependencies

- `ForumUserRegistry`: An external module which holds actual user state, allowing it to be queried based on a corresponding account, and recovering some representation of a user.

## Concepts

- `ForumUser`: Represents an actual forum user, which is provided by `ForumUserRegistry` dependency.

- `ForumSudoId`: Identifies a forum sudo authority.

- `ModerationAction`: Represents a moderation outcome applied to a post or a thread. Includes a moderation date, a text rationale and the `ForumSudoId` of moderator.

- `Post`: Represents a thread post, and includes initial text, identifier for the corresponding `Thread`, a position, an optional `ModerationAction`, a vector of identifiers for `PostTextEdit` instances ordered chronologically by edit time, creation date and identifier of `ForumUser` creator. Is identified with an integer which is unique across all instances in all categories.

- `PostTextEdit`: Represents a revision of the text of a `Post`, includes new text and revision date.

- `Thread`: Represents a thread, and includes a title, identifier for the corresponding `Category`, a position, an optional `ModerationAction`, number of unmoderated posts, number of moderated posts, creation date and identifier of `ForumUser` creator. Is identified with an integer which is unique across all instances in all categories.

- `Category`: Represents a forum category, and includes a title, short topic description text, creation date, deletion status, archival status, number of subcategories, number of unmoderated threads, number of moderated threads, optional `Category` identifier for parent category and `ForumSudoId` of creator. Is identified with an integer which is unique across all instances in all categories.

## State

- `categoryById`: Map `Category` identifier to corresponding instance.

- `nextCategoryId`: Identifier value to be used for the next `Category` created.

- `threadById`: Map `Thread` identifier to corresponding instance.

- `nextThreadId`: Identifier value to be used for next `Thread` in `threadById`

- `postById`: Map `Post` identifier to corresponding instance.

- `nextPostId`: Identifier value to be used for next `Post` created.

- `forumSudo`: Optional `ForumSudoId` of forum sudo.

## Events

Each event has payload as sublist

- `CategoryCreated`: A category was introduced
  - category identifier

- `CategoryUpdated`: A category had its direct archival and/or deletion status updated to a new value.
  - category identifier
  - whether deletion status was changed, if so to what
  - whether archival status was changed, if so to what

- `ThreadCreated`: A thread was created with.
  - thread identifier

- `ThreadModerated`: A thread was moderated.
  - thread identifier

- `PostAdded`: A post was introduced.
  - post identifier

- `PostModerated`: A post was moderated.
  - post identifier

- `PostTextUpdated`: A post had the post text edited.
  - post identifier
  - edit number of new text

- `ForumSudoSet`: A new forum sudo was set by root.
  - optional account for old forum sudo
  - optional account of new forum sudo

## Dispatchable Methods

### `create_category`

#### Payload

- `origin`: call origin
- `parent`: not set, or category identifier of parent
- `title`: text title
- `description`: description text

#### Description

Add a new category.

#### Errors

- Bad signature
- `forumSudo` does not match signature
- `parent` is set, but does not exist
- `parent` is set, but is (directly or indirectly) archived or deleted category
- category depth exceeded, see `MAX_CATEGORY_DEPTH`.
- `title` invalid
- `description` invalid

#### Side effect(s)

- `categoryById` extended with new `Category` under old value of `nextCategoryId` as identifier
- `nextCategoryId` incremented
- if `parent` is not root, then subcategory count

#### Event(s)

- `CategoryCreated`

### `update_category`

#### Payload

- `origin`: call origin
- `categoryId`: id of category to update
- `archive`: whether to archive
- `deleted`: whether it is deleted

#### Description

Update a category.

#### Errors

- Bad signature
- `forumSudo` does not match signature
- `categoryId` does not match any category
- category with `categoryId` is directly deleted, cannot be unarchived
- category with `categoryId` is indirectly archived or deleted, cannot be updated in any way

_Note: We don't mind directly archived/deleted categories from being re-archived/deleted respectively, we just ignore_

#### Side effect(s)

- category in `categoryById` under key `categoryId` has archival and deletion status equal to `archive` and `delete`, respectively, and if parent is set, then it will have number of subcategories decremented if `delete` is true, but category was perviously not.

#### Event(s)

- `CategoryUpdated` with new status values, as they apply

### `create_thread`

#### Payload

- `origin`: call origin
- `categoryId`: identifier of category where thread should be created
- `title`: thread title text
- `text`: text of initial post

#### Description

Create new thread in category.

#### Errors

- Bad signature
- Signer is not forum user
- `categoryId` not a valid category
- `categoryId` is (directly or indirectly) archived
- `categoryId` is (directly or indirectly) deleted
- `title` not valid
- `text` not valid

#### Side effect(s)

- `threadById` extended with new `Thread` instance under old value of `nextThreadId` as identifier
- increment unmoderated thread count of category with identifier `categoryId`
- `nextThreadId` incremented

#### Event(s)

- `ThreadCreated`

### `moderate_thread`

#### Payload

- `origin`: call origin
- `threadId`: identifier of `Thread` to delete
- `rationale`:  text rationale

#### Description

Moderate thread.

#### Errors

- Bad signature
- `forumSudo` does not match signature
- `threadId` does not match any thread
- `rationale` invalid
- thread already moderated
- thread in (directly or indirectly) archived category
- thread in (directly or indirectly) deleted category

#### Side effect(s)

- corresponding `Thread` instance in `threadById` has `ModerationAction` set
- update moderated and unmoderated thread count of corresponding category

#### Event(s)

- `ThreadModerated`

### `add_post`

#### Payload

- `origin`: call origin
- `threadId`: thread in which to add post
- `text`: text of post

#### Description

Adding post to thread

#### Errors

- Bad signature
- Signer is not forum user
- thread with identifier value `threadId` does not exist
- thread with identifier value `threadId` is moderated
- category of thread is (directly or indirectly) archived
- category is (directly or indirectly) deleted

#### Side effect(s)

- `postById` extended with new `Post` instance with under old value of `nextPostId` as identifier
- `nextPostId` updated
- unmoderated posts updated in corresponding thread

#### Event(s)

- `PostAdded`

### `edit_post_text`

#### Payload

- `origin`: call origin
- `postId`: post to be edited
- `new_text`: new text

#### Description

Edit post text

#### Errors

- Bad signature
- `postId` does not correspond to a post
- Signer does not match creator of post with identifier `postId`
- post with identifier `postId` is moderated
- category is (directly or indirectly) archived
- category is (directly or indirectly) deleted

#### Side effect(s)

- Post with identifier `postId` has its edit vector with new `PostTextEdit` instance at front

#### Event(s)

- `PostTextUpdated`

### `moderate_post`

#### Payload

- `origin`: call origin
- `postId`: post to be edited
- `rationale`:  text rationale

#### Description

Moderate post

#### Errors

- Bad signature
- `forumSudo` does not match signature
- `postId` does not match any post
- `rationale` invalid
- post already moderated
- thread already moderated
- thread in (directly or indirectly) archived category
- thread in (directly or indirectly) deleted category

#### Side effect(s)

- corresponding `Post` instance in `postById` has `ModerationAction` set
- update moderated and unmoderated post count of corresponding thread

#### Event(s)

- `PostModerated`

### `set_forum_sudo`

Note: I am not sure how to do this one, I am not familiar with Substrate **Sudo** functionality.

#### Payload

- `newForumSudo`: optional account of new proposed forum sudo

#### Description

Set forum sudo.

#### Errors

- Bad signature
- Not root origin

#### Side effect(s)

- `forumSudo` equals `newForumSudo`

#### Event(s)

- `ForumSudoSet`
