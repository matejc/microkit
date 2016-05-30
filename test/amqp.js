'use strict';

const expect = require('chai').expect;

const Amqp = require('../lib/queue/amqp');
const MicroKit = require('../lib');

describe('Amqp', () => {
  beforeEach(() => {
    const microkit = new MicroKit({name: 'test'});
    this.amqp = new Amqp(
      {url: process.env.AMQP_URL || 'amqp://localhost'},
      {logger: microkit.logger}
    );
  });

  afterEach(() => {
    return this.amqp.dispose();
  });

  it('should publish and subscribe on topic exchange', next => {
    this.amqp.subscribe('a.b.c.d', (msg, info) => {
      expect(msg).to.be.deep.equal({key: 'value'});
      expect(info.key).to.be.equal('a.b.c.d');
      process.nextTick(next);
    }).then(() => {
      return this.amqp.publish('a.b.c.d', {key: 'value'});
    });
  });

  it('should publish and subscribe to headers exchange', next => {
    const label = {selector1: 'value1'};
    this.amqp.subscribe(label, (msg, info) => {
      expect(msg).to.be.deep.equal({key: 'value'});
      expect(info.headers).to.be.deep.equal(label);
      process.nextTick(next);
    }).then(() => {
      return this.amqp.publish(label, {key: 'value'});
    });
  });
});
