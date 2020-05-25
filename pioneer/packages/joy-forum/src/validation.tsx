import React from 'react';
import { withMulti } from '@polkadot/react-api/with';
import { InputValidationLengthConstraint } from '@joystream/types/lib/forum';
import { withForumCalls } from './calls';

export type ValidationProps = {
  categoryTitleConstraint?: InputValidationLengthConstraint,
  categoryDescriptionConstraint?: InputValidationLengthConstraint,
  threadTitleConstraint?: InputValidationLengthConstraint,
  postTextConstraint?: InputValidationLengthConstraint,
  threadModerationRationaleConstraint?: InputValidationLengthConstraint,
  postModerationRationaleConstraint?: InputValidationLengthConstraint
};

const loadAllValidationConstraints = withForumCalls<ValidationProps>(
  ['categoryTitleConstraint', {}],
  ['categoryDescriptionConstraint', {}],
  ['threadTitleConstraint', {}],
  ['postTextConstraint', {}],
  ['threadModerationRationaleConstraint', {}],
  ['postModerationRationaleConstraint', {}]
);

function waitForRequiredConstraints (
  requiredConstraintNames: Array<keyof ValidationProps>
) {
  return function (Component: React.ComponentType<any>) {
    return function (props: ValidationProps) {
      let nonEmptyProps = requiredConstraintNames
        .filter(name => props[name] !== undefined)
        .length;
      if (nonEmptyProps !== requiredConstraintNames.length) {
        return <em>Loading validation constraints...</em>;
      }
      return <Component {...props} />;
    };
  };
}

function withValidationConstraints (requiredConstraintNames: Array<keyof ValidationProps>) {
  return function (Component: React.ComponentType<ValidationProps>) {
    return withMulti(
      Component,
      loadAllValidationConstraints,
      waitForRequiredConstraints(requiredConstraintNames)
    );
  };
}

export const withCategoryValidation = withValidationConstraints(
  ['categoryTitleConstraint', 'categoryDescriptionConstraint']);

export const withThreadValidation = withValidationConstraints(
  ['threadTitleConstraint', 'postTextConstraint']);

export const withReplyValidation = withValidationConstraints(
  ['postTextConstraint']);

export const withThreadModerationValidation = withValidationConstraints(
  ['threadModerationRationaleConstraint']);

export const withPostModerationValidation = withValidationConstraints(
  ['postModerationRationaleConstraint']);
