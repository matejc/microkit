#!/usr/bin/env node

const yarsay = require('yarsay');
const yargs = require('yargs');
const fs = require('fs');
const path = require('path');

const MicrotKit = require('../lib');

yarsay('Maybe if you pack it in lambda, it will just work!  \n-- Pirate Jack, the eternal optimist ...').say();

const argv = yargs
  .alias('config', 'c').require('c').string('c')
  .alias('lambda', 'l').require('l').string('l')
  .argv;

const config = JSON.parse(fs.readFileSync(argv.config, 'utf-8'));
const microkit = new MicrotKit(config);

const lambda = require(path.resolve(argv.lambda));

microkit.logger.info('starting lambda function');
lambda(microkit);
