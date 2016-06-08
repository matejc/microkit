'use strict';

const _ = require('lodash');

const load = require('../../util/load');

class EnvProvider {
  constructor(options) {
    this.file = options.file;
    this.ignoreMissing = options.ignoreMissing;
  }

  load() {
    let file;

    try {
      file = load(this.file);
    } catch (e) {
      if (
        (e.name === 'missing_file' && !this.ignoreMissing) ||
        e.name !== 'missing_file'
      ) {
        throw e;
      }
    }

    return this._loadEnv(file);
  }

  _loadEnv(obj) {
    return _.omit(_.mapValues(obj, (val, key) => {
      if (_.isString(val)) {
        return process.env[val];
      }

      if (_.isObject(val)) {
        return this._loadEnv(obj[key]);
      }
    }), _.isUndefined);
  }
}

module.exports = EnvProvider;
