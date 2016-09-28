'use strict';

const expect = require('chai').expect;
const fakeredis = require('fakeredis');
const Promise = require('bluebird');

const MicroKit = require('../lib');

Promise.promisifyAll(fakeredis.RedisClient.prototype);
Promise.promisifyAll(fakeredis.Multi.prototype);

describe('Redis', () => {
  beforeEach(() => {
    this.client = fakeredis.createClient();
    this.microkit = new MicroKit({
      name: 'test',
      api: {
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
    });

  });

  afterEach(() => {
    return this.client.quit();
  });

  it('should set', next => {
    this.microkit.api.call('set', {key: 'ovca', value: '{"si", "ti"}'})
      .then((o) => {
        expect(o.data).to.be.equal('OK');
        process.nextTick(next);
      });
  });
});
