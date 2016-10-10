'use strict';

const _ = require('lodash');
const moment = require('moment');
const YAML = require('yamljs');

const Formatter = require('../formatter');

class PrettyFormatter extends Formatter {
  format(info, msg, context, error) {
    const compiled = _.template(this.options.format);

    try {
        if (_.has(context, 'toJSON')) {
            context = context.toJSON();
        }

        context = _.isEmpty(context) ? null : this._leftpad(YAML.stringify(context, 2).trim(), 2);
    } catch(e) {
        context = null
    }

    return compiled({
      date: moment().utc().format(this.options.dateFormat),
      message: msg,
      context: context,
      error: error ? error.stack : null,
      component: info.component
    });
  }

  get defaultOptions() {
    return {
      format: "<% if (component) { %>[<%= component %>] <% } %><%= date %>> <%= message %><% if (!_.isEmpty(context)) { %>\n<%= context %><% } %><% if (error) { %>\n<%= error %><% } %>",
      dateFormat: ''
    };
  }

  _leftpad(block) {
    return _.map(block.split('\n'), line => '  ' + line).join('\n');
  }
}

module.exports = PrettyFormatter;
