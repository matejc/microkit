'use strict';

const _ = require('lodash');
const pretty = require('js-object-pretty-print').pretty;

function ISODateString(d) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() +'-' +
        pad(d.getUTCMonth() + 1) + '-' +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' +
        pad(d.getUTCSeconds()) + 'Z';
}

class PrettyFormatter {
  format(info, msg, context, error) {
    const data = [];

    let errorName = error?error.toString():'';
    let errorStack = error?error.stack:'';

    if (msg) {
      data.push(ISODateString(new Date(info.time))+': '+msg+(errorName?' ('+errorName+')':''));
    } else {
      data.push(ISODateString(new Date(info.time))+(errorName?' '+errorName:''));
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
