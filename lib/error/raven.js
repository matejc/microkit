'use strict';

const Promise = require('bluebird');
const raven = require('raven');

class RavenErrorReporter {
  constructor(clientOptions, context, microkit) {
    this.logger = microkit.logger.create('raven');

    this.client = new raven.Client(clientOptions.url, clientOptions.transport);
    this.client.setExtraContext(context);

    this.client.on('error', error => {
      this.logger.error('cannot capture error', error);
    });
  }

  capture(error, context, options) {
    options = options || {};

    if (options.wait) {
      return new Promise((res, rej) => {
        const onLogged = () => {
          res();
        }

        const onError = err => {
          rej(err);
        }

        this.client.once('logged', onLogged);
        this.client.once('error', onError);
        this.client.captureError(error, context);
      });
    }

    return Promise.resolve(this.client.captureError(error, context));
  }
}

module.exports = RavenErrorReporter;
