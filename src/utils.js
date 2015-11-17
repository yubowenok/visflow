/**
 * @fileoverview Utility functions for VisFlow.
 */

'use strict';

/** @const */
visflow.utils = {};

/**
 * Gets event offset corresponding to parent element.
 * @param {!jQuery.event} event jQuery event.
 * @param {!jQuery} jqthis jQuery selection of the element in question.
 * @return {{left: number, top: number}} Offset computed.
 */
visflow.utils.getOffset = function(event, jqthis) {
  var parentOffset = jqthis.parent().offset();
  if (parentOffset == null) {
    VisFlow.error('parentOffset is null');
    return null;
  }
  return {
    left: event.pageX - parentOffset.left,
    top: event.pageY - parentOffset.top
  };
};

/**
 * Generates a random string of given length.
 * @param {number} len String length.
 * @return {string} A random string of length 'len'.
 */
visflow.utils.randomString = function(len) {
  return Math.random().toString(36).substr(2, len);
};

/**
 * Checks if two segments [p1, p2] and [q1, q2] intersect.
 * @param {!Array<number>} p1
 * @param {!Array<number>} p2
 * @param {!Array<number>} q1
 * @param {!Array<number>} q2
 */
visflow.utils.intersect = function(p1, p2, q1, q2) {
  return this.twosides(p1, p2, q1, q2) && this.twosides(q1, q2, p1, p2);
};

/**
 * Checks if q1, q2 are on two different sides of line (p1, p2).
 * @param {!Array<number>} p1
 * @param {!Array<number>} p2
 * @param {!Array<number>} q1
 * @param {!Array<number>} q2
 * @return {boolean} True if q1, q2 are on two different sides.
 */
visflow.utils.twosides = function(p1, p2, q1, q2) {
  var a = p2[1] - p1[1],
      b = p1[0] - p2[0],
      c = p2[0] * p1[1] - p1[0] * p2[1];
  var v1 = a * q1[0] + b * q1[1] + c,
      v2 = a * q2[0] + b * q2[1] + c;

  var eps = 1E-9;
  if (Math.abs(v1) < eps || Math.abs(v2) < eps) {
    // Touch
    return true;
  }
  return v1 * v2 < 0;
};

/**
 * Compares array or number lexicographically.
 * @param {number|!Array<number>} a
 * @param {number|!Array<number>} b
 * @return {number} -1, 0, 1 for a < b, a = b and a > b.
 */
visflow.utils.compare = function(a, b) {
  if (a instanceof Array) {
    if (a.length != b.length)
      return console.error('array length not match');
    for (var i = 0; i < a.length; i++) {
      if (a < b) return -1;
      else if (a > b) return 1;
    }
    return 0;
  } else {
    if (a < b) return -1;
    else if (a > b) return 1;
    return 0;
  }
};

/**
 * Hashes a string.
 * @param {string} s
 * @return {number} Hash value between [0, 1000000007).
 */
  visflow.utils.hashString = function(s) {
  if (typeof s != 'string') {
    return console.error('x is not a string to hash');
  }
  var a = 3, p = 1000000007;
  var result = 0;
  for (var i = 0; i < s.length; i++) {
    var x = s.charCodeAt(i);
    result = (result * a + x) % p;
  }
  return result;
};

/**
 * Removes the bumpy jquery ui style widget header for table
 * @param {!jQuery} jqview
 */
visflow.utils.blendTableHeader = function(jqview) {
  jqview.find('.ui-widget-header')
    .removeClass('ui-widget-header');
};


/** @const {!Array<string>} */
visflow.utils.gradeToType = ['empty', 'int', 'float', 'string'];

/** @const {!Object<number>} */
visflow.utils.typeToGrade = {
  empty: 0,
  int: 1,
  float: 2,
  stirng: 3
};

/**
 * Parses a token and returns its value and type.
 * @param {string} text
 */
visflow.utils.parseToken = function(text) {
  // grades: [empty, int, float, string]
  text += ''; // convert to string
  var res;
  res = text.match(/^-?[0-9]+/);
  if (res && res[0] === text) {
    return {
      type: 'int',
      value: parseInt(text),
      grade: 1
    };
  }
  res = text.match(/^-?([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)/);
  if (res && res[0] === text) {
    return {
      type: 'float',
      value: parseFloat(text),
      grade: 2
    };
  }
  if (text === '') {  // empty constants are ignored
    return {
      type: 'empty',
      value: null,
      grade: 0
    };
  }
  return {
    type: 'string',
    value: text,
    grade: 3
  };
};

/**
 * Makes 'child' class inherit 'base' class.
 * @param {*} child
 * @param {*} base
 */
visflow.utils.inherit = function(child, base) {
  child.prototype = Object.create(base.prototype);
  child.prototype.constructor = child;
  child.base = base.prototype;
};
