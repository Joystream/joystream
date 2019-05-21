
// NOTE: The purpose of this context is to immitate a Substrate storage for the forum until it's implemented as a substrate runtime module.

import React, { useReducer, createContext, useContext } from 'react';
import { Category, Thread, Reply } from './types';

type CategoryId = number;
type ThreadId = number;
type ReplyId = number;

type ForumState = {
  sudo?: string,

  nextCategoryId: CategoryId,
  categoryById: Map<CategoryId, Category>,
  rootCategoryIds: CategoryId[],
  categoryIdsByParentId: Map<CategoryId, CategoryId[]>,

  nextThreadId: ThreadId,
  threadById: Map<ThreadId, Thread>,
  threadIdsByCategoryId: Map<CategoryId, ThreadId[]>,

  nextReplyId: ReplyId,
  replyById: Map<ReplyId, Reply>,
  replyIdsByThreadId: Map<ThreadId, ReplyId[]>
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
  type: 'SetForumSudo',
  sudo?: string
};

type NewCategoryAction = {
  type: 'NewCategory',
  category: Category
};

type UpdateCategoryAction = {
  type: 'UpdateCategory',
  category: Category,
  id: CategoryId
};

type NewThreadAction = {
  type: 'NewThread',
  thread: Thread
};

type UpdateThreadAction = {
  type: 'UpdateThread',
  thread: Thread,
  id: ThreadId
};

type NewReplyAction = {
  type: 'NewReply',
  reply: Reply
};

type UpdateReplyAction = {
  type: 'UpdateReply',
  reply: Reply,
  id: ReplyId
};

type ForumAction =
  SetForumSudo |
  NewCategoryAction |
  UpdateCategoryAction |
  NewThreadAction |
  UpdateThreadAction |
  NewReplyAction |
  UpdateReplyAction;

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
      const { category } = action;
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

      categoryById.set(nextCategoryId, category);
      nextCategoryId = nextCategoryId + 1;

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
      const { thread } = action;
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

      threadById.set(nextThreadId, thread);
      nextThreadId = nextThreadId + 1;

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

    case 'NewReply': {
      const { reply } = action;
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

      replyById.set(nextReplyId, reply);
      nextReplyId = nextReplyId + 1;

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

    default:
      throw new Error('Unexptected action: ' + JSON.stringify(action));
  }
}

function functionStub () {
  throw new Error('Function needs to be set in ForumProvider');
}

export type ForumContextProps = {
  state: ForumState,
  dispatch: React.Dispatch<ForumAction>
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
