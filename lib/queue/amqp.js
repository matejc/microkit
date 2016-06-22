'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const amqp = require('amqplib');
const retry = require('amqplib-retry');
const delay = require('amqp-delay.node');

const Service = require('../service');
const Event = require('./event');

class AmqpEvent extends Event {
  get data() {
    return JSON.parse(this._data.content.toString());
  }

  get id() {
    return (this._data.properties.headers && !_.isEmpty(this._data.properties.headers)) ?
      this._data.properties.headers : this._data.fields.routingKey;
  }
}

/**
 * Amqp implementation of queue
 */
class Amqp extends Service {
  constructor(options, context) {
    super(options, context);

    const socketOptions = _.defaults(this.options.socketOptions || {}, {
      channelMax: 100, heartbeat: 10
    });

    this.topicExchange = this.options.topicExchange || 'amq.topic';
    const topicExchangeOptions = _.defaults(this.options.topicExchangeOptions || {}, {
      durable: true
    });

    this.headersExchange = this.options.headersExchange || 'amq.headers';
    const headersExchangeOptions = _.defaults(this.options.headersExchangeOptions || {}, {
      durable: true
    });

    this.connection = Promise.resolve(amqp.connect(this.options.url, socketOptions));

    // Setup error handlers
    this.connection.then(connection => {
      connection.on('error', err => this.context.events.emit('error', err));
      this.context.logger.debug('amqp connection established');
      return connection;
    });

    this.sendChannel = this.connection.then(connection => {
      return connection.createConfirmChannel();
    }).then(channel => {
      delay(channel);

      this.context.logger.debug('amqp channel created');
      return Promise.all([
        channel
          .assertExchange(this.topicExchange, 'topic', topicExchangeOptions)
          .tap(() => this.context.logger.debug('topic exchange created')),
        channel
          .assertExchange(this.headersExchange, 'headers', headersExchangeOptions)
          .tap(() => this.context.logger.debug('headers exchange created'))
      ]).return(channel);
    }).tap(() => this.context.logger.info('amqp ready'));
  }

  get defaultOptions() {
    return {
      url: 'amqp://localhost',
      serialize: JSON.stringify,
      deserialize: JSON.parse
    };
  }

  publish(key, message, options) {
    message = this._toBuffer(message);
    options = _.defaults(options || {}, {persistent: true});

    return this.sendChannel.then(channel => {
      if (options.delay) {
        channel = channel.delay(options.delay);
      }

      if (_.isObject(key)) {
        options.headers = key;
        return Promise.resolve(channel.publish(this.headersExchange, '', message, options));
      }

      return Promise.resolve(channel.publish(this.topicExchange, key, message, options));
    });
  }

  subscribe(selector, handler, options) {
    options = _.defaults(options || {}, this.options.subscribeDefaults || {}, {
      retry: true,
      maxRetries: 0
    });

    const queueOptions = _.defaults(options.queueOptions || {}, {
      durable: Boolean(options.queue)
    });
    const info = {queue: options.queue};

    return this._createChannel().then(channel => {
      channel.prefetch(1);

      return Promise.resolve().then(() => {
        return channel.assertQueue(options.queue, queueOptions);
      }).then(queue => {
        this.context.logger.debug('amqp queue created', info);

        let failureQueue;

        if (options.queue && options.retry) {
          failureQueue = channel.assertQueue(queue.queue + '.failure', queueOptions);
        }

        return [queue, failureQueue];
      }).spread((queue, failureQueue) => {
        queue = queue.queue;
        failureQueue = failureQueue ? failureQueue.queue : undefined;

        const bind = selector => {
          const exchangeType = _.isObject(selector) ? 'headers' : 'topic';
          return exchangeType === 'headers' ?
            channel.bindQueue(queue, this.headersExchange, '', selector) :
            channel.bindQueue(queue, this.topicExchange, selector);
        };

        return (
          _.isArray(selector) ?
            Promise.map(selector, bind) :
            Promise.resolve(bind(selector))
        ).return([queue, failureQueue]);
      }).tap(() => {
        this.context.logger.debug('queue bound to exchange');
      }).spread((queue, failureQueue) => {
        // message processing handler
        const process = msg => {
          const event = new AmqpEvent(msg);
          return handler(event).return(msg);
        };

        if (failureQueue) {
          return channel.consume(queue, retry({
            channel: channel,
            consumerQueue: queue,
            failureQueue: failureQueue,
            handler: msg => {
              if (!msg) {
                return;
              }

              return process(msg);
            },
            delay: attempts => {
              if (attempts > options.maxRetries) {
                return -1;
              }

              const delay = Math.pow(2, attempts);
              return delay * 1000;
            }
          }));
        }

        return channel.consume(queue, msg => {
          if (!msg) {
            return;
          }

          return process(msg).then(msg => {
            channel.ack(msg);
          }).catch(err => {
            channel.nack(msg);
            throw err;
          });
        });
      }).tap(() => {
        this.context.logger.info('starting consuming queue', info);
      }).then(consumerInfo => () => {
        return Promise.resolve(channel.cancel(consumerInfo.consumerTag));
      });
    });
  }

  dispose() {
    return this.connection.then(connection => connection.close());
  }

  _toBuffer(obj) {
    if (obj instanceof Buffer) {
      return obj;
    }

    return new Buffer(this.options.serialize(obj));
  }

  _createChannel() {
    return this.connection.then(connection => {
      return Promise.resolve(connection.createChannel());
    });
  }
}

module.exports = Amqp;
