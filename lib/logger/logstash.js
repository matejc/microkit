'use strict';

const net = require('net');
const tls = require('tls');
const fs = require('fs');
const _ = require('lodash');

const Service = require('../service');

const ECONNREFUSED_REGEXP = /ECONNREFUSED/;

class LogstashLogger extends Service {
  constructor(options, context) {
    super(options, context);

    this._retries = -1;
    this._log_queue = [];
    this._connected = false;
    this._socket = null;

    this.connect();
  }

  get defaultOptions() {
    return {
      port: 28777,
      host: 'localhost',
      max_connection_retries: 4,
      timeout_connect_retries: 1000,
      ssl_enable: false,
      ssl_key: '',
      ssl_cert: '',
      ca: '',
      ssl_passphrase: '',
      reject_unauthorized: false,
    };
  }

  connect() {
    const tryReconnect = true;

    this._retries++;
    this._connecting = true;
    this._terminating = false;

    if (this.options.ssl_enable) {
      const options = {
        key: this.options.ssl_key ? fs.readFileSync(this.options.ssl_key) : null,
        cert: this.options.ssl_cert ? fs.readFileSync(this.options.ssl_cert) : null,
        passphrase: this.options.ssl_passphrase ? this.options.ssl_passphrase : null,
        rejectUnauthorized: this.options.reject_unauthorized === true,
        ca: this.ca ? _.map(this.options.ca, path => fs.readFileSync(path)) : null
      };

      this._socket = new tls.connect(this.options.port, this.options.host, options, () => {
        this._socket.setEncoding('UTF-8');
        this.announce();
        this._connecting = false;
      });
    } else {
      this._socket = new net.Socket();
    }

    this._socket.on('error', err => {
      this._connecting = false;
      this._connected = false;

      if (typeof(this._socket) !== 'undefined' && this._socket != null) {
        this._socket.destroy();
      }

      this._socket = null;

      if (!ECONNREFUSED_REGEXP.test(err.message)) {
        tryReconnect = false;
        this.context.error.cature('cannot reconnect', err);
      }
    });

    this._socket.on('timeout', () => {
      if (this._socket.readyState !== 'open') {
        this._socket.destroy();
      }
    });

    this._socket.on('connect', () => {
      this._retries = 0;
    });

    this._socket.on('close', had_error => {
      this._connected = false;

      if (
        this.options.max_connect_retries < 0 ||
        this._retries < this.options.max_connect_retries
      ) {
        if (!this._connecting) {
          setTimeout(() => this.connect(), this.options.timeout_connect_retries);
        }
      } else {
        this._log_queue = [];
        this._silent = true;
        this.context.error.capture(new Error('Max retries reached'));
      }
    });

    if (!this.options.ssl_enable) {
      this._socket.connect(this.options.port, this.options.host, () => {
        this.announce();
        this._connecting = false;
      });
    }
  }

  close() {
    this._terminating = true;
    if (this._connected && this._socket) {
      this._connected = false;
      this._socket.end();
      this._socket.destroy();
      this._socket = null;
    }
  }

  announce() {
    this._connected = true;
    this.flush();

    if (this._terminating) {
      this.close();
    }
  }

  flush() {
    _.forEach(this._log_queue, data => this.sendLog(data));
    this._log_queue.length = 0;
  }

  sendLog(message) {
    this._socket.write(JSON.stringify(message) + '\n');
  }

  log(info, msg, context, error) {
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

    if (!this._connected) {
      this._log_queue.push(data);
    } else {
      this.sendLog(data);
    }
  }
}

module.exports = LogstashLogger;
