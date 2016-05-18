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
  stats: {name: 'statsd', host: "statsd.example.com"} // stats reporter config
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
```

## License

MIT © [Jaka Hudoklin](https://x-truder.net)

[npm-image]: https://badge.fury.io/js/microkit.svg
[npm-url]: https://npmjs.org/package/microkit
[travis-image]: https://travis-ci.org/x-truder/microkit.svg?branch=master
[travis-url]: https://travis-ci.org/x-truder/microkit
[daviddm-image]: https://david-dm.org/x-truder/microkit.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/x-truder/microkit
[coveralls-image]: https://coveralls.io/repos/x-truder/microkit/badge.svg
[coveralls-url]: https://coveralls.io/r/x-truder/microkit
