'use strict';

const crypto = require("crypto");
const _ = require('lodash');
const domain = require('domain');
const cookie = require('cookie');
const urlParser = require('url');
const onFinished = require('on-finished');

const Service = require('./service');

class ExpressHandler extends Service {
  register(server) {
    this.server = server;
  }

  get defaultOptions() {
    return {
      defaultLogFields: ['method', 'host', 'protocol', 'url', 'ip'],
      logFields: []
    };
  }

  get preHandler() {
    return (req, res, next) => {
      // catch async express errors
      const reqDomain = domain.create();
      reqDomain.on('error', next);

      // set real ip
      req.connection.ip = req.headers['x-real-ip'] || req.connection.remoteAddress;

      // set request id
      req.id = req.headers['x-request-id'] || crypto.randomBytes(16).toString("hex");

      const http = _.cloneDeep(this._filterFields(
        this._parseRequest(req),
        this.options.logFields.concat(this.options.defaultLogFields)
      ));

      // attach logger to request
      req.logger = this.context.logger;

      let start;
      onFinished(res, (err, res) => {
        const end = new Date() - start;
        this.context.logger.info(
          `${http.method} ${http.url} ${res.statusCode} ${end}ms`,
          _.extend(http, {time: end, status: res.statusCode})
        );
      });

      this.context.logger.debug(`${http.method} ${http.url}`, http);
      start = new Date();
      return reqDomain.run(next);
    };
  }

  get postHandler() {
    return (err, req, res, next) => {
      const status = err.status || err.statusCode || err.status_code || 500;

      // skip anything not marked as an internal server error
      if (status < 500) {
        return next(err);
      }

      const info = this._parseRequest(req);

      this.context.error.capture(err, info).finally(() => next(err, req, res));
    };
  }

  _filterFields(obj, fields) {
    const result = {};
    _.forEach(fields, field => {
      _.set(result, field, _.get(obj, field));
    });
    return result;
  }

  _parseRequest(req) {
    var http = {};

    // headers:
    //
    //   node: req.headers
    //   express: req.headers
    //   koa: req.header
    //
    http.headers = req.headers || req.header || {};

    // method:
    //
    //   node: req.method
    //   express: req.method
    //   koa: req.method
    //
    http.method = req.method;

    // host:
    //
    //   node: req.headers.host
    //   express: req.hostname in > 4 and req.host in < 4
    //   koa: req.host
    //
    http.host = req.hostname || req.host || http.headers.host || '<no host>';

    // protocol:
    //
    //   node: <n/a>
    //   express: req.protocol
    //   koa: req.protocol
    //
    http.protocol = 'https' === req.protocol || true === req.secure || true === (req.socket || {}).encrypted ? 'https' : 'http';

    // url (including path and query string):
    //
    //   node: req.originalUrl
    //   express: req.originalUrl
    //   koa: req.url
    //
    http.originalUrl = req.originalUrl || req.url;

    // absolute url
    http.url = http.protocol + '://' + http.host + http.originalUrl;

    // query string
    //
    //   node: req.url (raw)
    //   express: req.query
    //   koa: req.query
    //
    http.query = req.query || urlParser.parse(req.originalUrl || '', true).query;

    // cookies:
    //
    //   node: req.headers.cookie
    //   express: req.headers.cookie
    //   koa: req.headers.cookie
    //
    http.cookies = cookie.parse(req.headers.cookie || '');

    // body data:
    //
    //   node: req.body
    //   express: req.body
    //   koa: req.body
    //
    http.data = req.body;
    if (['GET', 'HEAD'].indexOf(req.method) === -1) {
      if (typeof http.data === 'undefined') {
        http.data = '<unavailable>';
      }
    }

    if (http.data && {}.toString.call(http.data) !== '[object String]') {
      // Make sure the request body is a string
      http.data = JSON.stringify(http.data);
    }

    // client ip:
    //
    //   node: req.connection.remoteAddress
    //   express: req.ip
    //   koa: req.ip
    //
    http.ip = req.ip || (req.connection || {}).remoteAddress;

    return http;
  }

  dispose() {
    if (this.server) {
      return new Promise(res => this.server.close(() => res()));
    }

    return Promise.resolve();
  }
}

module.exports = ExpressHandler;
