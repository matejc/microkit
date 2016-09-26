'use strict';

const expect = require('chai').expect;
const nock = require('nock');
const Promise = require('bluebird');

const MicroKit = require('../lib');
const fakeredis = require('fakeredis');

Promise.promisifyAll(fakeredis.RedisClient.prototype);
Promise.promisifyAll(fakeredis.Multi.prototype);


describe('multy', function() {
  beforeEach(() => {
    this.client = fakeredis.createClient();
    this.microkit = new MicroKit({
      name: 'test',
      api: {
        name: 'multy',
        apis: {
          swagger: {
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
          },
          redis: {
            name: 'redis',
            client: this.client,
            methods: {
              get: {
                method: 'get',
                args: ['<%= key %>'],
                parse: 'json'
              },
              set: {
                method: 'set',
                args: ['<%= key %>', '<%= value %>']
              },
              hmset: {
                method: 'hmset',
                args: ['<%= key %>', '$.value']
              },
              hmget: {
                method: 'hgetall',
                args: ['<%= key %>']
              }
            }
          }
        }
      }
    });
  });

  it('swagger', () => {
    nock('http://localhost:12345')
      .get('/v1/transactions/ovca')
      .reply(200, {data: 'test'});

    return this.microkit.api.call('swagger', 'getTransaction', {txid: 'ovca', 'x-gatehub-admin': 'beje'})
      .then((o) => {
        expect(o.data).to.be.deep.equal({data: 'test'});
      });
  });
  it('redis', next => {
    this.microkit.api.call('redis', 'set', {key: 'ovca', value: '{"si", "ti"}'})
      .then((o) => {
        expect(o.data).to.be.equal('OK');
        process.nextTick(next);
      });
  });
});
