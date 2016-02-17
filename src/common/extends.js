/**
 * @fileoverview Extensions to libraries.
 */

/**
 * Extends sorting to support custom types.
 * @param {string} size File size in bytes.
 * @return {number}
 */
$.fn.dataTable.ext.type.order['data-size-pre'] = function(size) {
  var unit = size.replace(/[\d\s\.]/g, '').toLowerCase();
  var base = 1000;
  var multiplier = 1;
  switch (unit) {
    case 'mb':
      multiplier *= base;
    case 'kb':
      multiplier *= base;
    case 'b':
      break;
  }
  return parseFloat(size) * multiplier;
};
