'use strict';

const Promise = require('bluebird');
const raven = require('raven');

const Service = require('../service');

class RavenErrorReporter extends Service {
  constructor(options, context) {
    super(options, context);

    this.client = new raven.Client(this.options.url, this.options.transport);
    this.client.setExtraContext(context);

    this.client.on('error', error => {
      this.context.logger.error('cannot capture error', error);
    });
  }

  get defaultOptions() {
    return {
      timeout: 5000
    };
  }

  capture(error, context, options) {
    return new Promise((res, rej) => {
      const onLogged = () => {
        res();
      };

      const onError = err => {
        rej(err);
      };

      this.client.once('logged', onLogged);
      this.client.once('error', onError);
      this.client.captureError(error, context);
    }).timeout(this.options.timeout);
  }
}

module.exports = RavenErrorReporter;
