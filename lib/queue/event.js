'use strict';

const _ = require('lodash');

class Event {
  constructor(data) {
    this._data = data;
  }

  /**
   * Gets event id
   */
  get id() {
    return this._data.id;
  }

  /**
   * Gets data associated with event
   */
  get data() {
    return this._data.data;
  }

  /**
   * Gets resource associated with event
   */
  resource(name) {
    if (!_.has(this.data, ['resources', name])) {
      throw new Error(`Resource ${name} not defined`);
    }

    return this.data.resources[name];
  }
}

module.exports = Event;
