
// NOTE: The purpose of this context is to immitate a Substrate storage for the forum until it's implemented as a substrate runtime module.

import React, { useReducer, createContext, useContext } from 'react';
import { Category, Thread, Reply, ModerationAction } from '@joystream/types/forum';
import { BlockAndTime } from '@joystream/types/common';
import { Option, Text, GenericAccountId } from '@polkadot/types';

type CategoryId = number;
type ThreadId = number;
type ReplyId = number;

export type ForumState = {
  sudo?: string;

  nextCategoryId: CategoryId;
  categoryById: Map<CategoryId, Category>;
  rootCategoryIds: CategoryId[];
  categoryIdsByParentId: Map<CategoryId, CategoryId[]>;

  nextThreadId: ThreadId;
  threadById: Map<ThreadId, Thread>;
  threadIdsByCategoryId: Map<CategoryId, ThreadId[]>;

  nextReplyId: ReplyId;
  replyById: Map<ReplyId, Reply>;
  replyIdsByThreadId: Map<ThreadId, ReplyId[]>;
};

const initialState: ForumState = {
  sudo: undefined,

  nextCategoryId: 1,
  categoryById: new Map(),
  rootCategoryIds: [],
  categoryIdsByParentId: new Map(),

  nextThreadId: 1,
  threadById: new Map(),
  threadIdsByCategoryId: new Map(),

  nextReplyId: 1,
  replyById: new Map(),
  replyIdsByThreadId: new Map()
};

type SetForumSudo = {
  type: 'SetForumSudo';
  sudo?: string;
};

type NewCategoryAction = {
  type: 'NewCategory';
  category: Category;
  onCreated?: (newId: number) => void;
};

type UpdateCategoryAction = {
  type: 'UpdateCategory';
  category: Category;
  id: CategoryId;
};

type NewThreadAction = {
  type: 'NewThread';
  thread: Thread;
  onCreated?: (newId: number) => void;
};

type UpdateThreadAction = {
  type: 'UpdateThread';
  thread: Thread;
  id: ThreadId;
};

type ModerateThreadAction = {
  type: 'ModerateThread';
  id: ThreadId;
  moderator: string;
  rationale: string;
};

type NewReplyAction = {
  type: 'NewReply';
  reply: Reply;
  onCreated?: (newId: number) => void;
};

type UpdateReplyAction = {
  type: 'UpdateReply';
  reply: Reply;
  id: ReplyId;
};

type ModerateReplyAction = {
  type: 'ModerateReply';
  id: ReplyId;
  moderator: string;
  rationale: string;
};

type ForumAction =
  SetForumSudo |
  NewCategoryAction |
  UpdateCategoryAction |
  NewThreadAction |
  UpdateThreadAction |
  ModerateThreadAction |
  NewReplyAction |
  UpdateReplyAction |
  ModerateReplyAction;

function reducer (state: ForumState, action: ForumAction): ForumState {
  switch (action.type) {
    case 'SetForumSudo': {
      const { sudo } = action;
      return {
        ...state,
        sudo
      };
    }

    case 'NewCategory': {
      const { category, onCreated } = action;
      const { parent_id } = category;

      let {
        nextCategoryId,
        categoryById,
        rootCategoryIds,
        categoryIdsByParentId
      } = state;

      if (parent_id) {
        let childrenIds = categoryIdsByParentId.get(parent_id.toNumber());
        if (!childrenIds) {
          childrenIds = [];
        }
        childrenIds.push(nextCategoryId);
        categoryIdsByParentId.set(parent_id.toNumber(), childrenIds);
      } else {
        if (!rootCategoryIds) {
          rootCategoryIds = [];
        }
        rootCategoryIds.push(nextCategoryId);
      }

      const newId = nextCategoryId;
      categoryById.set(newId, category);
      nextCategoryId = nextCategoryId + 1;

      if (onCreated) onCreated(newId);

      return {
        ...state,
        nextCategoryId,
        categoryById,
        rootCategoryIds,
        categoryIdsByParentId
      };
    }

    case 'UpdateCategory': {
      const { category, id } = action;
      const { categoryById } = state;

      categoryById.set(id, category);

      return {
        ...state,
        categoryById
      };
    }

    case 'NewThread': {
      const { thread, onCreated } = action;
      const { category_id } = thread;

      let {
        nextThreadId,
        threadById,
        threadIdsByCategoryId
      } = state;

      let threadIds = threadIdsByCategoryId.get(category_id.toNumber());
      if (!threadIds) {
        threadIds = [];
        threadIdsByCategoryId.set(category_id.toNumber(), threadIds);
      }
      threadIds.push(nextThreadId);

      const newId = nextThreadId;
      threadById.set(newId, thread);
      nextThreadId = nextThreadId + 1;

      if (onCreated) onCreated(newId);

      return {
        ...state,
        nextThreadId,
        threadById,
        threadIdsByCategoryId
      };
    }

    case 'UpdateThread': {
      const { thread, id } = action;
      const { threadById } = state;

      threadById.set(id, thread);

      return {
        ...state,
        threadById
      };
    }

    case 'ModerateThread': {
      const { id, moderator, rationale } = action;
      const { threadById } = state;

      const thread = threadById.get(id) as Thread;
      const moderation = new ModerationAction({
        moderated_at: BlockAndTime.newEmpty(),
        moderator_id: new GenericAccountId(moderator),
        rationale: new Text(rationale)
      });
      const threadUpd = new Thread(Object.assign(
        thread.cloneValues(),
        { moderation: new Option(ModerationAction, moderation) }
      ));
      threadById.set(id, threadUpd);

      return {
        ...state,
        threadById
      };
    }

    case 'NewReply': {
      const { reply, onCreated } = action;
      const { thread_id } = reply;

      let {
        nextReplyId,
        replyById,
        replyIdsByThreadId
      } = state;

      let replyIds = replyIdsByThreadId.get(thread_id.toNumber());
      if (!replyIds) {
        replyIds = [];
        replyIdsByThreadId.set(thread_id.toNumber(), replyIds);
      }
      replyIds.push(nextReplyId);

      const newId = nextReplyId;
      replyById.set(newId, reply);
      nextReplyId = nextReplyId + 1;

      if (onCreated) onCreated(newId);

      return {
        ...state,
        nextReplyId,
        replyById,
        replyIdsByThreadId
      };
    }

    case 'UpdateReply': {
      const { reply, id } = action;
      const { replyById } = state;

      replyById.set(id, reply);

      return {
        ...state,
        replyById
      };
    }

    case 'ModerateReply': {
      const { id, moderator, rationale } = action;
      const { replyById } = state;

      const reply = replyById.get(id) as Reply;
      const moderation = new ModerationAction({
        moderated_at: BlockAndTime.newEmpty(),
        moderator_id: new GenericAccountId(moderator),
        rationale: new Text(rationale)
      });
      const replyUpd = new Reply(Object.assign(
        reply.cloneValues(),
        { moderation: new Option(ModerationAction, moderation) }
      ));
      replyById.set(id, replyUpd);

      return {
        ...state,
        replyById
      };
    }

    default:
      throw new Error('Unexptected action: ' + JSON.stringify(action));
  }
}

function functionStub () {
  throw new Error('Function needs to be set in ForumProvider');
}

export type ForumContextProps = {
  state: ForumState;
  dispatch: React.Dispatch<ForumAction>;
};

const contextStub: ForumContextProps = {
  state: initialState,
  dispatch: functionStub
};

export const ForumContext = createContext<ForumContextProps>(contextStub);

export function ForumProvider (props: React.PropsWithChildren<{}>) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ForumContext.Provider value={{ state, dispatch }}>
      {props.children}
    </ForumContext.Provider>
  );
}

export function useForum () {
  return useContext(ForumContext);
}
