'use strict';

const load = require('../../util/load');

class FileConfigProvider {
  constructor(options) {
    this.file = options.file;
    this.ignoreMissing = options.ignoreMissing;
  }

  load() {
    try {
      return load(this.file);
    } catch (e) {
      if (
        (e.name === 'missing_file' && !this.ignoreMissing) ||
        e.name !== 'missing_file'
      ) {
        throw e;
      }
    }
  }
}

module.exports = FileConfigProvider;
