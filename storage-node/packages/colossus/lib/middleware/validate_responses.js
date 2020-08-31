/*
 * This file is part of the storage node for the Joystream project.
 * Copyright (C) 2019 Joystream Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict'

const debug = require('debug')('joystream:middleware:validate')

// Function taken directly from https://github.com/kogosoftwarellc/open-api/tree/master/packages/express-openapi
module.exports = function (req, res, next) {
  const strictValidation = !!req.apiDoc['x-express-openapi-validation-strict']
  if (typeof res.validateResponse === 'function') {
    const send = res.send
    res.send = function expressOpenAPISend(...args) {
      const onlyWarn = !strictValidation
      if (res.get('x-express-openapi-validation-error-for') !== undefined) {
        return send.apply(res, args)
      }
      if (res.get('x-express-openapi-validation-for') !== undefined) {
        return send.apply(res, args)
      }

      const body = args[0]
      let validation = res.validateResponse(res.statusCode, body)
      let validationMessage
      if (validation === undefined) {
        validation = { message: undefined, errors: undefined }
      }
      if (validation.errors) {
        const errorList = Array.from(validation.errors)
          .map((_) => _.message)
          .join(',')
        validationMessage = `Invalid response for status code ${res.statusCode}: ${errorList}`
        debug(validationMessage)
        // Set to avoid a loop, and to provide the original status code
        res.set('x-express-openapi-validation-error-for', res.statusCode.toString())
      }
      if ((onlyWarn || !validation.errors) && res.statusCode) {
        res.set('x-express-openapi-validation-for', res.statusCode.toString())
        return send.apply(res, args)
      }
      res.status(500)
      return res.json({ error: validationMessage })
    }
  }
  next()
}
