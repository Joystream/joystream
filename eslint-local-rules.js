module.exports = {
  'no-throw': {
    meta: {
      type: 'problem',
      docs: {
        description: 'disallow the use of throw keyword',
        category: 'Possible Errors',
        recommended: true,
      },
      schema: [],
    },

    create: function (context) {
      return {
        ThrowStatement(node) {
          context.report({
            node: node,
            message: "The use of 'throw' keyword is not allowed.",
          })
        },
      }
    },
  },
}
