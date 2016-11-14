'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const amqp = require('amqp-connection-manager');
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

    this.connection = amqp.connect([this.options.url], socketOptions);

    this.connection.on('connect', () => {
      this.context.logger.info('amqp connection established');
    });

    this.connection.on('disconnect', params => {
      this.context.error.capture(params.err, {service: 'queue'});
    });

    this.sendChannel = this.connection.createChannel({
      setup: channel => {
        delay(channel);

        this.context.logger.debug('amqp channel created');

        return Promise.all([
          channel
            .assertExchange(this.topicExchange, 'topic', topicExchangeOptions)
            .tap(() => this.context.logger.debug('topic exchange created')),
          channel
            .assertExchange(this.headersExchange, 'headers', headersExchangeOptions)
            .tap(() => this.context.logger.debug('headers exchange created'))
        ]);
      }
    });
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
    options = _.defaults(options || {}, this.options.publishDefaults || {}, {
      persistent: true
    });

    let channel = this.sendChannel;

    // if delay is added setup delay channel
    if (options.delay) {
      channel = channel.delay(options.delay);
    }

    let toPublish;

    // publish to headers or topic exchange
    if (_.isObject(key)) {
      options.headers = key;
      toPublish = channel.publish(this.headersExchange, '', message, options);
    } else {
      toPublish = channel.publish(this.topicExchange, key, message, options);
    }

    // Wait for confirmations that messages have been sent
    if (this.options.publishTimeout) {
      return Promise.resolve(toPublish).timeout(this.options.publishTimeout);
    } else {
      return Promise.resolve(toPublish);
    }
  }

  subscribe(selector, handler, options) {
    options = _.defaults(options || {}, this.options.subscribeDefaults || {}, {
      retry: true,
      maxRetries: 0,
      prefetch: 1
    });

    const queueOptions = _.defaults(options.queueOptions || {}, {
      durable: Boolean(options.queue)
    });
    const info = {queue: options.queue};

    const channel = this.connection.createChannel({
      setup: channel => {
        // prefetch messages from queue
        channel.prefetch(options.prefetch);

        return Promise.all([
          channel.assertQueue(options.queue, queueOptions),
          Promise.try(() => {
            if (options.queue && options.retry) {
              return channel.assertQueue(options.queue + '.failure', queueOptions);
            }
          })
        ]).tap(() => {
          this.context.logger.info('amqp queue created', info)
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

          // if retry is enabled, use retry handler
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
        });
      }
    });

    return Promise.resolve(channel.waitForConnect()).then(() => {
      this.context.logger.info('listening for messages');
    }).return(channel);
  }

  dispose() {
    return this.connection.close();
  }

  _toBuffer(obj) {
    if (obj instanceof Buffer) {
      return obj;
    }

    return new Buffer(this.options.serialize(obj));
  }
}

module.exports = Amqp;
