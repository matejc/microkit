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

var microkit = new MicroKit({
  name: 'myAwesomeService',
  logLevel: 'info',
  queue: {name: 'amqp'},
  error: {name: 'raven'},
  stats: {name: 'statsd'}
});

// Logging
microkit.logger.info('message', {key: 'value'});
microkit.logger.fatal(new Error("some error"));
microkit.logger.error('message', {key: 'value', err: new Error("some error")});

var logger = microkit.logger.create('componentName', {some: 'context'});
logger.info('message', {key: 'value'});

// Queue
microkit.queue.publish({key: 'value'}, {some: 'data'});
microkit.queue.subscribe({key: 'value'}, (msg, info) => {
  console.log(msg);
  console.log(info.key);
});

// Error reporting
microkit.error.capture(new Error('some error'));

// Metrics
microkit.stats.increment('some.key', 10);
microkit.stats.gauge('some.key', 9999.999);
microkit.stats.timer('some.key', new Date());
setTimeout(() => {
  microkit.stats.time('some.key', new Date());
}, 1000);
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
