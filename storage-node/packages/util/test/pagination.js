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

const expect = require('chai').expect
const mockHttp = require('node-mocks-http')

const pagination = require('@joystream/storage-utils/pagination')

describe('util/pagination', function () {
  describe('openapi()', function () {
    it('should add parameters and definitions to an API spec', function () {
      const api = pagination.openapi({})

      // Parameters
      expect(api).to.have.property('components')

      expect(api.components).to.have.property('parameters')
      expect(api.components.parameters).to.have.property('paginationLimit')

      expect(api.components.parameters.paginationLimit).to.have.property('name')
      expect(api.components.parameters.paginationLimit.name).to.equal('limit')

      expect(api.components.parameters.paginationLimit).to.have.property('schema')
      expect(api.components.parameters.paginationLimit.schema).to.have.property('type')
      expect(api.components.parameters.paginationLimit.schema.type).to.equal('integer')

      expect(api.components.parameters.paginationOffset).to.have.property('name')
      expect(api.components.parameters.paginationOffset.name).to.equal('offset')

      expect(api.components.parameters.paginationOffset).to.have.property('schema')
      expect(api.components.parameters.paginationOffset.schema).to.have.property('type')
      expect(api.components.parameters.paginationOffset.schema.type).to.equal('integer')

      // Defintiions
      expect(api.components).to.have.property('schemas')
      expect(api.components.schemas).to.have.property('PaginationInfo')

      expect(api.components.schemas.PaginationInfo).to.have.property('type')
      expect(api.components.schemas.PaginationInfo.type).to.equal('object')

      expect(api.components.schemas.PaginationInfo).to.have.property('properties')
      expect(api.components.schemas.PaginationInfo.properties)
        .to.be.an('object')
        .that.has.all.keys('self', 'next', 'prev', 'first', 'last')
    })
  })

  describe('paginate()', function () {
    it('should add pagination links to a response object', function () {
      const req = mockHttp.createRequest({
        method: 'GET',
        url: '/foo?limit=10',
        query: {
          limit: 10, // Mock is a little stupid, we have to explicitly set query
        },
        headers: {
          host: 'localhost',
        },
        protocol: 'http',
      })

      const res = pagination.paginate(req, {})

      expect(res).to.have.property('pagination').that.has.all.keys('self', 'first', 'next')

      expect(res.pagination.self).to.equal('http://localhost/foo?limit=10')
      expect(res.pagination.first).to.equal('http://localhost/foo?limit=10&offset=0')
      expect(res.pagination.next).to.equal('http://localhost/foo?limit=10&offset=10')
    })

    it('should add a last pagination link when requested', function () {
      const req = mockHttp.createRequest({
        method: 'GET',
        url: '/foo?limit=10&offset=15',
        query: {
          limit: 10, // Mock is a little stupid, we have to explicitly set query
          offset: 15,
        },
        headers: {
          host: 'localhost',
        },
        protocol: 'http',
      })

      const res = pagination.paginate(req, {}, 35)

      expect(res).to.have.property('pagination').that.has.all.keys('self', 'first', 'next', 'prev', 'last')

      expect(res.pagination.self).to.equal('http://localhost/foo?limit=10&offset=15')
      expect(res.pagination.first).to.equal('http://localhost/foo?limit=10&offset=0')
      expect(res.pagination.last).to.equal('http://localhost/foo?limit=10&offset=35')
      expect(res.pagination.prev).to.equal('http://localhost/foo?limit=10&offset=5')
      expect(res.pagination.next).to.equal('http://localhost/foo?limit=10&offset=25')
    })
  })
})
