# microkit [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Node.js microservice toolkit

Abstraction toolkit for microservices, to make nodejs developers happy again.

## Installation

```sh
$ npm install --save microkit
```

## Usage

```js
var MicroKit = require('microkit');

// Instantiate MicroKit
var microkit = new MicroKit({
  name: 'myAwesomeService',
  logLevel: 'info',
  catchGlobal: true, // catch global errors
  queue: {
    name: 'amqp',
    url: "amqp://localhost",
    queue: 'myAwesomeService'
  }, // queue provider config
  error: {name: 'raven', url: "https://dd..ba:d8..35@app.getsentry.com/24343"}, // error reporter config
  stats: {name: 'statsd', host: "statsd.example.com"}, // stats reporter config
  api: {
    name: 'swagger',
    services: {
      serviceA: {url: 'http://api.domain.com/swagger.yaml'},
    }
  }
});

/** or for development it will log on stdout
 *  var microkit = new MicroKit({name: 'myAwesomeService'});
 **/

// Logging
microkit.logger.debug('message', {key: 'value'});
microkit.logger.info('message', {key: 'value'});
microkit.logger.warn('message', {key: 'value'});
microkit.logger.fatal(new Error("some error"));
microkit.logger.error('message', {key: 'value', err: new Error("some error")});

var logger = microkit.logger.create('componentName', {some: 'context'});
logger.info('message', {key: 'value'});

// Queue
microkit.queue.publish({key: 'value'}, {some: 'data'});
microkit.queue.publish({key: {key: 'value'}, message: {key: 'value'}});
microkit.queue.subscribe({key: 'value'}, (msg, info) => {
  console.log("message", msg);
  console.log("key", info.key);
});

// Error reporting
microkit.error.capture(new Error('some error'));

// Metrics
microkit.stats.increment('some.key', 10);
microkit.stats.gauge('some.key', 9999.999);
microkit.stats.timer('some.key', new Date());
setTimeout(() => {
  microkit.stats.timer('some.key', new Date());
}, 1000);

// Exit handling
microkit.onExit(() => server.close());

// Express integration (logging, error reporting)
app.use(microkit.express.preHandler); // before all middlewares
app.use(microkit.express.postHandler); // after middlewares

// API calling
microkit.api.call('serviceA', 'getUser', {id: '123-456'});

// config
microkit.config.get('key.value');

// common errors
const MyConnectionError = microkit.errors.ConnectionError.extend({
  name: 'MyConnectionError'
});
throw new MyConnectionError({code: 'database_error', error: err});
```

## License

MIT © [ProteusLabs](https://proteuslabs.io)

[npm-image]: https://badge.fury.io/js/microkit.svg
[npm-url]: https://npmjs.org/package/microkit
[travis-image]: https://travis-ci.org/proteuslabs/microkit.svg?branch=master
[travis-url]: https://travis-ci.org/proteuslabs/microkit
[daviddm-image]: https://david-dm.org/proteuslabs/microkit.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/proteuslabs/microkit
[coveralls-image]: https://coveralls.io/repos/proteuslabs/microkit/badge.svg
[coveralls-url]: https://coveralls.io/r/proteuslabs/microkit
