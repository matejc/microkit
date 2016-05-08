/**
 * @file cache simple value cache
 * @author Proteus team
 */

'use strict';

const _ = require('lodash');

/**
 * This callback type is called `requestCallback` and is displayed as a global symbol.
 *
 * @callback cacheFunction
 * @param {*} name Key under which to save
 * @param {*} value Value to save
 */

/**
 * Simple value cache
 * @return {cacheFuction} caching function
 */
module.exports = function() {
  var cache = {};
  return (name, value) => {
    if (cache[name]) return cache[name];
    if (_.isFunction(value)) {
      return cache[name] = value();
    }
    return cache[name] = value;
  }
};
