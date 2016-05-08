'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

const MicroKit = require('../lib');

describe('microkit', () => {
  beforeEach(() => {
    this.microkit = new MicroKit({name: 'test'});
  });

  describe('logger', () => {
    it('shold get logger and log a message', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.logger.info("test");
    });

    it('should get logger and log a message with context', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.logger.error('some message', 1, 2, 3, {err: new Error(), key: 'value'});
    });
  });

  describe('error', () => {
    it('should capture error', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.error.capture(new Error());
    });
  });

  describe('stats', () => {
    it('should increment counters', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.stats.increment('a.b.c.d');
      microkit.stats.increment('a.b.c.d', 10);

      expect(microkit.stats.counters['a.b.c.d']).to.be.equal(11);
    });

    it('should update gauge', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.stats.gauge('a.b.c.e', 30);
      expect(microkit.stats.gauges['a.b.c.e']).to.be.equal(30);
    });

    it('should count time', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.stats.timing('a.b.c.f', new Date());
      microkit.stats.timing('a.b.c.f', new Date());
    });
  });

  describe('queue', () => {
    it('should publish a message', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.queue.publish('a.b.c.d', {key: 'value'});
    });

    it('should publish with key as object', () => {
      const microkit = new MicroKit({name: 'test'});

      microkit.queue.publish({prop1: 'value1'}, {key: 'value'});
    });
  });
});
