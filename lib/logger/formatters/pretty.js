'use strict';

const _ = require('lodash');
const pretty = require('js-object-pretty-print').pretty;

class PrettyFormatter {
  format(info, msg, context, error) {
    const data = [];

    let errorName = error?error.toString():'';
    let errorStack = error?error.stack:'';

    if (msg) {
      data.push(new Date(info.time).toISOString()+': '+msg+(errorName?' ('+errorName+')':''));
    } else {
      data.push(new Date(info.time).toISOString()+(errorName?' '+errorName:''));
    }

    if (!_.isEmpty(context)) {
        data.push('\n'+pretty(context, 2));
    }

    if (errorStack) {
      data.push(errorStack);
    }

    return '---\n'+data.join('\n');
  }
}

module.exports = PrettyFormatter;
