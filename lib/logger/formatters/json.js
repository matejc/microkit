'use strict';

const _ = require('lodash');

const Formatter = require('../formatter');

class JSONFormatter extends Formatter {
  format(info, msg, context, error) {
    const data = {};

    if (msg) {
      data.msg = msg;
    }

    if (error) {
      data.error = error.toString();
      data.stack = error.stack;
    }

    _.extend(data, info);
    _.extend(data, context);

    return JSON.stringify(data);
  }
}

module.exports = JSONFormatter;
