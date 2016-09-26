'use strict';

const expect = require('chai').expect;
const nock = require('nock');
const Promise = require('bluebird');

const MicroKit = require('../lib');

describe('Swagger', function() {
  beforeEach(() => {
    this.microkit = new MicroKit({
      name: 'test',
      api: {
        name: 'swagger',
        defaultParameters: {
          'x-gatehub-admin': '1',
          'x-gatehub-uuid': '123-123'
        },
        spec: {
          host: 'localhost:12345',
          swagger: 2.0,
          basePath: '/v1',
          schemes: ['http'],
          consumes: ['application/json'],
          produces: ['application/json'],
          paths: {
            '/transactions/{txid}': {
              get: {
                operationId: 'getTransaction',
                parameters: [
                  {
                    name: 'txid',
                    in: 'path',
                    required: true
                  },{
                    name: 'x-gatehub-admin',
                    in: 'header',
                    required: true
                  },{
                    name: 'x-gatehub-uuid',
                    in: 'header'
                  },
                ]
              }
            }
          }
        }
      }
    });
  });

  it('should get', () => {
    nock('http://localhost:12345')
      .get('/v1/transactions/ovca')
      .reply(200, {data: 'test'});

    return this.microkit.api.call('getTransaction', {txid: 'ovca', 'x-gatehub-admin': 'beje'})
      .then((o) => {
        expect(o.data).to.be.deep.equal({data: 'test'});
      });
  });
});
