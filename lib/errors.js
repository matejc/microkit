'use strict';

const _ = require('lodash');

class MicrokitError extends Error {
  constructor(options) {
    super();

    // Capture the original stack
    Error.captureStackTrace(this, this.constructor);

    // Error has to have name
    if (!_.has(options, 'name')) {
      throw new Error('error name must be defined');
    }

    // Error has to have error code
    if (!_.has(options, 'code')) {
      throw new Error('error code must be defined');
    }

    if (_.has(options, 'extra') && !_.isObject(options.extra)) {
      throw new Error('extra parameters must be object');
    }

    this._options = options;
  }

  /**
   * Gets id associated with an error
   */
  get id() {
    if (this._id) {
      return this._id;
    }

    const length = 48;
    this._id = Math.round(
      (Math.pow(36, length + 1) -
       Math.random() * Math.pow(36, length))
    ).toString(36).slice(1);

    return this._id;
  }

  /**
   * Gets error name
   */
  get name() {
    return this._options.name;
  }

  /**
   * Gets error code
   */
  get code() {
    return this._options.code;
  }

  /**
   * Gets error that caused this error
   */
  get error() {
    return this._options.error;
  }

  /**
   * Gets message associated with an error
   */
  get message() {
    const extra = _.extend(_.clone(this.extra), {code: this.code});
    return this._options.message ?
      `[${this._toKVString(extra)}] ${this._options.message}`:
      `[${this._toKVString(extra)}]`;
  }

  /**
   * Gets extra parameters associated with an error
   */
  get extra() {
    return this._options.extra || {};
  }

  /**
   * Gets metadata associated with error
   */
  get meta() {
    return this._options.meta;
  }

  /**
   * Returns public information about error
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      message: this._options.message,
      extra: this.extra
    };
  }

  _toKVString(obj) {
    return _.join(_.map(obj, (val, key) => `${key}=${val}`), ' ');
  }
}

MicrokitError.extend = function(baseOptions) {
  return class childError extends this {
    constructor(options) {
      super(_.defaultsDeep(options, baseOptions));
    }
  };
}

module.exports = {
  Error: MicrokitError,
  NotImplementedError: MicrokitError.extend({
    name: 'NotImplementedError',
    meta: {httpCode: 501}
  }),
  InternalError: MicrokitError.extend({
    name: 'InternalError',
    meta: {httpCode: 500}
  }),
  NotFoundError: MicrokitError.extend({
    name: 'NotFoundError',
    meta: {httpCode: 404}
  }),
  UnautorizedError: MicrokitError.extend({
    name: 'UnautorizedError',
    meta: {httpCode: 401}
  }),
  ConnectionError: MicrokitError.extend({
    name: 'ConnectionError',
    meta: {httpCode: 504}
  }),
  ValidationError: MicrokitError.extend({
    name: 'ValidationError',
    meta: {httpCode: 400}
  }),
  LogicalError: MicrokitError.extend({
    name: 'LogicalError',
    meta: {httpCode: 422}
  })
};
