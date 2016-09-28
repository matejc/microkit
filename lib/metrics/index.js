'use strict';

const Joi = require('joi');
const Promise = require('bluebird');

const Controller = require('../controller');
const Factory = require('../factory');

const StatsdMetricsProvider = require('./statsd');
const LogMetricsProvider = require('./log');
const QueueMetricsProvider = require('./queue');

class MetricsController extends Controller {
  /**
   * Sends metric
   * @param {string} type metric type (gauge, timer, increment)
   * @param {string} name name of the metric
   * @param {integer} value value to send
   * @param {object} tags tag metric with
   * @param {object.unit} options metric unit (ms,km,eur)
   * @param {object.increment} options whether metric should be handled as increment to the previous value
   * @param {object.decrement} options whether metric should be handler as decrement to previous value
   */
  send(name, value, tags, options) {
    return Promise.try(() => {
      options = options || {};

      Joi.assert(name, Joi.string().required(), 'Metric name must be a string');
      Joi.assert(value, Joi.number().required(), 'Metric value must be integer');
      Joi.assert(tags, Joi.object().pattern(/.*/, Joi.string()).optional(), 'Metric tag value must be string');

      // Coerce value to number
      value = Joi.number().validate(value).value;

      return this.service.send(name, value, tags, options);
    });
  }
}

class MetricsFactory extends Factory {
  get types() {
    return {
      statsd: Controller.wrapType(MetricsController, StatsdMetricsProvider),
      log: Controller.wrapType(MetricsController, LogMetricsProvider),
      queue: Controller.wrapType(MetricsController, QueueMetricsProvider)
    };
  }
}

module.exports = MetricsFactory;
