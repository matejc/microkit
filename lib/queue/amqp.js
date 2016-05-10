'use strict';

const EventEmitter = require('events');
const _ = require('lodash');
const Promise = require('bluebird');

const amqp = require('amqplib');
const retry = require('amqplib-retry');

/**
 * Amqp implementation of queue
 */
class Amqp extends EventEmitter {
  constructor(options, mikrokit) {
    super();

    this.options = options = _.defaults(options, {
      url: 'amqp://localhost',
      serialize: JSON.stringify,
      deserialize: JSON.parse
    });

    const socketOptions = _.defaults(options.socketOptions || {}, {
      channelMax: 100, heartbeat: 10
    });

    this.topicExchange = options.topicExchange || 'amq.topic';
    const topicExchangeOptions = _.defaults(options.topicExchangeOptions || {}, {
      durable: true
    });

    this.headersExchange = options.headersExchange || 'amq.headers';
    const headersExchangeOptions = _.defaults(options.headersExchangeOptions || {}, {
      durable: true
    });

    this.connection = Promise.resolve(amqp.connect(options.url, socketOptions));

    // Setup error handlers
    this.connection.then(connection => {
      connection.on('error', err => this.emit('error', err));
      return connection;
    });

    this.sendChannel = this.connection.then(connection => {
      return connection.createConfirmChannel();
    }).then(channel => {
      return Promise.all([
        channel.assertExchange(this.topicExchange, 'topic', topicExchangeOptions),
        channel.assertExchange(this.headersExchange, 'headers', headersExchangeOptions)
      ]).return(channel);
    });

    mikrokit.onExit(() => {
      return this.connection.then(connection => connection.close());
    }, true);
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

  publish(key, message, options) {
    message = this._toBuffer(message);
    options = _.defaults(options || {}, {persistent: true});

    return this.sendChannel.then(channel => {
      if (_.isObject(key)) {
        options.headers = key;
        return Promise.resolve(channel.publish(this.headersExchange, '', message, options));
      }

      return Promise.resolve(channel.publish(this.topicExchange, key, message, options));
    });
  }

  subscribe(selector, handler, options) {
    options = _.defaults(options || {}, {
      retry: true
    });

    const queueOptions = _.defaults(options.queueOptions || {}, {
      durable: Boolean(options.queue)
    });

    const exchangeType = _.isObject(selector) ? 'headers' : 'topic';

    return this._createChannel().then(channel => {
      channel.prefetch(1);

      return Promise.resolve().then(() => {
        return channel.assertQueue(options.queue, queueOptions);
      }).then(queue => {
        let failureQueue;

        if (options.queue && options.retry) {
          failureQueue = channel.assertQueue(queue.queue + '.failure', queueOptions);
        }

        return [queue, failureQueue];
      }).spread((queue, failureQueue) => {
        queue = queue.queue;
        failureQueue = failureQueue ? failureQueue.queue : undefined;

        const bind = selector => {
          return exchangeType === 'headers' ?
            channel.bindQueue(queue, this.headersExchange, '', selector) :
            channel.bindQueue(queue, this.topicExchange, selector);
        };

        return (
          _.isArray(selector) ?
            Promise.map(selector, bind) :
            Promise.resolve(bind(selector))
        ).return([queue, failureQueue]);
      }).spread((queue, failureQueue) => {
        const process = msg => {
          let parsed;

          try {
            parsed = this.options.deserialize(msg.content.toString());
          } catch (err) {
            console.error('Error deserializing AMQP message content.', err);
          }

          return Promise.resolve(handler(parsed, {
            key: exchangeType === 'headers' ?
              msg.properties.headers : msg.fields.routingKey,
            queue: this,
            message: msg,
            channel: channel
          })).return(msg);
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
      }).then(consumerInfo => () => {
        return Promise.resolve(channel.cancel(consumerInfo.consumerTag));
      });
    });
  }
}

module.exports = Amqp;
