
import React from 'react';
import { AccountId, Text, Bool } from '@polkadot/types';
import { Option, Vector } from '@polkadot/types/codec';
import { Category, CategoryId, Thread, ThreadId, Reply } from './types';
import { useForum } from './Context';

const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
let categoryId = 0;
let threadId = 0;
let replyId = 0;

export function MockState () {
  const { dispatch } = useForum();
  if (categoryId >= 100) {
    return <></>;
  }

  const newCategory = (parentId?: number) => {
    categoryId++;
    const name = (!parentId ? `Root category ` : `Subcategory `) + categoryId;
    const category = new Category({
      owner: new AccountId(address),
      parent_id: new Option(CategoryId, parentId),
      children_ids: new Vector(CategoryId, []),
      locked: new Bool(false),
      name: new Text(name),
      text: new Text(`**Description** of ${name}`)
    });
    dispatch({ type: 'NewCategory', category });
  };

  const newThread1 = (categoryId?: number) => {
    threadId++;
    const name = `Thread ${threadId} in category ${categoryId}`;
    const thread = new Thread({
      owner: new AccountId(address),
      category_id: new CategoryId(categoryId),
      locked: new Bool(false),
      pinned: new Bool(false),
      title: new Text(name),
      text: new Text(`**Description** of ${name}`)
    });
    dispatch({ type: 'NewThread', thread });

    if (threadId === 1) {
      for (let i = 0; i < 10; i++) {
        newReply(threadId);
      }
    }
  };

  const newThread = (categoryId?: number) => {
    newThread1(categoryId);
    if (categoryId === 1 || categoryId === 2) {
      // for (let i = 0; i < 35; i++) {
      for (let i = 0; i < 3; i++) {
        newThread1(categoryId);
      }
    }
  };

  const newReply = (threadId?: number) => {
    replyId++;
    const reply = new Reply({
      owner: new AccountId(address),
      thread_id: new ThreadId(threadId),
      text: new Text(`Reply ${replyId} in thread ${threadId}`)
    });
    dispatch({ type: 'NewReply', reply });
  };

  dispatch({ type: 'SetForumSudo', sudo: address });

  for (let i = 0; i < 3; i++) {
    newCategory();
    const rootCatId = categoryId;

    for (let j = 0; j < 3; j++) {
      newCategory(rootCatId);
      const subcatId = categoryId;
      newThread(rootCatId);

      for (let k = 0; k < 3; k++) {
        newThread(subcatId);
      }
    }
  }

  return <></>;
}
