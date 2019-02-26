'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;
const mock_http = require('node-mocks-http');

const pagination = require('joystream/util/pagination');

describe('pagination', function()
{
  describe('openapi()', function()
  {
    it('should add parameters and definitions to an API spec', function()
    {
      var api = pagination.openapi({});

      // Parameters
      expect(api).to.have.property('parameters');
      expect(api.parameters).to.have.property('paginationLimit');

      expect(api.parameters.paginationLimit).to.have.property('name');
      expect(api.parameters.paginationLimit.name).to.equal('limit');

      expect(api.parameters.paginationLimit).to.have.property('type');
      expect(api.parameters.paginationLimit.type).to.equal('integer');

      expect(api.parameters.paginationOffset).to.have.property('name');
      expect(api.parameters.paginationOffset.name).to.equal('offset');

      expect(api.parameters.paginationOffset).to.have.property('type');
      expect(api.parameters.paginationOffset.type).to.equal('integer');


      // Defintiions
      expect(api).to.have.property('definitions');
      expect(api.definitions).to.have.property('PaginationInfo');

      expect(api.definitions.PaginationInfo).to.have.property('type');
      expect(api.definitions.PaginationInfo.type).to.equal('object');

      expect(api.definitions.PaginationInfo).to.have.property('properties');
      expect(api.definitions.PaginationInfo.properties)
        .to.be.an('object')
        .that.has.all.keys('self', 'next', 'prev', 'first', 'last');
    });
  });


  describe('paginate()', function()
  {
    it('should add pagination links to a response object', function()
    {
      var req = mock_http.createRequest({
        method: 'GET',
        url: '/foo?limit=10',
        query: {
          limit: 10, // Mock is a little stupid, we have to explicitly set query
        },
        headers: {
          host: 'localhost',
        },
        protocol: 'http',
      });

      var res = pagination.paginate(req, {});

      expect(res).to.have.property('pagination')
        .that.has.all.keys('self', 'first', 'next');

      expect(res.pagination.self).to.equal('http://localhost/foo?limit=10');
      expect(res.pagination.first).to.equal('http://localhost/foo?limit=10&offset=0');
      expect(res.pagination.next).to.equal('http://localhost/foo?limit=10&offset=10');
    });

    it('should add a last pagination link when requested', function()
    {
      var req = mock_http.createRequest({
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
      });

      var res = pagination.paginate(req, {}, 35);

      expect(res).to.have.property('pagination')
        .that.has.all.keys('self', 'first', 'next', 'prev', 'last');

      expect(res.pagination.self).to.equal('http://localhost/foo?limit=10&offset=15');
      expect(res.pagination.first).to.equal('http://localhost/foo?limit=10&offset=0');
      expect(res.pagination.last).to.equal('http://localhost/foo?limit=10&offset=35');
      expect(res.pagination.prev).to.equal('http://localhost/foo?limit=10&offset=5');
      expect(res.pagination.next).to.equal('http://localhost/foo?limit=10&offset=25');
    });
  });
});
