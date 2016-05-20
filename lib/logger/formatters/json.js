'use strict';

const _ = require('lodash');

class JSONFormatter {
  format(level, info, msg, context, error) {
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

    return data;
  }
}

module.exports = JSONFormatter;
