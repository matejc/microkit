'use strict';

const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

const exists = require('./exists');

module.exports = function (filename) {
  if (!filename || !exists(filename)) {
    throw {name: 'missing_file', message: `Config file ${filename} does not exist`};
  }

  let file;
  const ext = path.extname(filename);
  switch (ext) {
    case '.json':
      file = fs.readFileSync(filename, 'utf8');
      return JSON.parse(file);
    case '.yaml':
      file = fs.readFileSync(filename, 'utf8');
      return YAML.parse(file);
    case '.js':
      return require(path.resolve(filename));
    default:
      throw new Error(`Unknown extension ${ext} for config ${filename}`);
  }
};
