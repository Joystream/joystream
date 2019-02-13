'use strict';

const debug = require('debug')('joystream:middleware:validate');

// Function taken directly from https://github.com/kogosoftwarellc/open-api/tree/master/packages/express-openapi
module.exports = function(req, res, next)
{
  const strictValidation = req.apiDoc['x-express-openapi-validation-strict'] ? true : false;
  if (typeof res.validateResponse === 'function') {
    const send = res.send;
    res.send = function expressOpenAPISend(...args) {
      const onlyWarn = !strictValidation;
      if (res.get('x-express-openapi-validation-error-for') !== undefined) {
        return send.apply(res, args);
      }
      if (res.get('x-express-openapi-validation-for') !== undefined) {
        return send.apply(res, args);
      }

      const body = args[0];
      let validation = res.validateResponse(res.statusCode, body);
      let validationMessage;
      if (validation === undefined) {
        validation = { message: undefined, errors: undefined };
      }
      if (validation.errors) {
        const errorList = Array.from(validation.errors).map(_ => _.message).join(',');
        validationMessage = `Invalid response for status code ${res.statusCode}: ${errorList}`;
        debug(validationMessage);
        // Set to avoid a loop, and to provide the original status code
        res.set('x-express-openapi-validation-error-for', res.statusCode.toString());
      }
      if (onlyWarn || !validation.errors) {
        res.set('x-express-openapi-validation-for', res.statusCode.toString());
        return send.apply(res, args);
      } else {
        res.status(500);
        return res.json({ error: validationMessage });
      }
    }
  }
  next();
}
