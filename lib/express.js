'use strict';

const domain = require('domain');
const cookie = require('cookie');
const urlParser = require('url');

const Service = require('./service');

class ExpressHandler extends Service {
  register(app) {
    this.app = app;
  }

  get requestHandler() {
    return (req, res, next) => {
      // catch async express errors
      const reqDomain = domain.create();
      reqDomain.on('error', next);

      // set real ip
      req.connection.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      return reqDomain.run(next);
    };
  }

  get errorHandler() {
    return (err, req, res, next) => {
      const status = err.status || err.statusCode || err.status_code || 500;

      // skip anything not marked as an internal server error
      if (status < 500) {
        return next(err);
      }

      const context = this._parseRequest(req);
      this.context.error.capture(err, context).finally(() => next(err, req, res));
    };
  }

  _parseRequest(req) {
    var kwargs = {};

    // headers:
    //
    //   node: req.headers
    //   express: req.headers
    //   koa: req.header
    //
    var headers = req.headers || req.header || {};

    // method:
    //
    //   node: req.method
    //   express: req.method
    //   koa: req.method
    //
    var method = req.method;

    // host:
    //
    //   node: req.headers.host
    //   express: req.hostname in > 4 and req.host in < 4
    //   koa: req.host
    //
    var host = req.hostname || req.host || headers.host || '<no host>';

    // protocol:
    //
    //   node: <n/a>
    //   express: req.protocol
    //   koa: req.protocol
    //
    var protocol = 'https' === req.protocol || true === req.secure || true === (req.socket || {}).encrypted ? 'https' : 'http';

    // url (including path and query string):
    //
    //   node: req.originalUrl
    //   express: req.originalUrl
    //   koa: req.url
    //
    var originalUrl = req.originalUrl || req.url;

    // absolute url
    var url = protocol + '://' + host + originalUrl;

    // query string
    //
    //   node: req.url (raw)
    //   express: req.query
    //   koa: req.query
    //
    var query = req.query || urlParser.parse(originalUrl || '', true).query;

    // cookies:
    //
    //   node: req.headers.cookie
    //   express: req.headers.cookie
    //   koa: req.headers.cookie
    //
    var cookies = cookie.parse(headers.cookie || '');

    // body data:
    //
    //   node: req.body
    //   express: req.body
    //   koa: req.body
    //
    var data = req.body;
    if (['GET', 'HEAD'].indexOf(method) === -1) {
      if (typeof data === 'undefined') {
        data = '<unavailable>';
      }
    }

    if (data && {}.toString.call(data) !== '[object String]') {
      // Make sure the request body is a string
      data = JSON.stringify(data);
    }

    // client ip:
    //
    //   node: req.connection.remoteAddress
    //   express: req.ip
    //   koa: req.ip
    //
    var ip = req.ip || (req.connection || {}).remoteAddress;

    // http interface
    var http = {
      method: method,
      query_string: query,
      headers: headers,
      cookies: cookies,
      data: data,
      url: url,
      env: process.env
    };

    // add remote ip
    http.env.REMOTE_ADDR = ip;

    // expose http interface
    kwargs.request = http;

    return kwargs;
  }

  dispose() {
    if (this.app) {
      return new Promise(res => this.app.close(() => res()));
    }

    return Promise.resolve();
  }
}

module.exports = ExpressHandler;
